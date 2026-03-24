const db = require('../config/db');

// 1. Summary Cards (Total Projects, Success Rate, Efficiency, Budget)
exports.getReportStats = async (req, res) => {
    try {
        const managerId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        const query = isAdmin ? `
            SELECT 
                (SELECT COUNT(*) FROM projects) AS totalProjects,
                (SELECT COUNT(*) FROM projects WHERE status = 'Completed') AS completedProjects,
                (SELECT COUNT(*) FROM projects WHERE status IN ('Active', 'On Track', 'In Progress')) AS activeProjects,
                (SELECT COUNT(*) * 10 FROM resources) AS total_capacity_pool,
                (SELECT IFNULL(SUM(allocated_units), 0) FROM project_resource_allocations) AS actual_units_used,
                (SELECT IFNULL(SUM(budget), 0) FROM projects) AS totalBudget,
                (SELECT IFNULL(SUM(total_cost), 0) FROM costs) AS totalSpent
        ` : `
            SELECT 
                (SELECT COUNT(*) FROM projects WHERE manager_id = ?) AS totalProjects,
                (SELECT COUNT(*) FROM projects WHERE manager_id = ? AND status = 'Completed') AS completedProjects,
                (SELECT COUNT(*) FROM projects WHERE manager_id = ? AND status IN ('Active', 'On Track', 'In Progress')) AS activeProjects,
                (SELECT COUNT(*) * 10 
                 FROM project_resource_allocations pra 
                 JOIN projects p ON pra.project_id = p.project_id 
                 WHERE p.manager_id = ?) AS total_capacity_pool,
                (SELECT IFNULL(SUM(allocated_units), 0) 
                 FROM project_resource_allocations pra 
                 JOIN projects p ON pra.project_id = p.project_id 
                 WHERE p.manager_id = ?) AS actual_units_used,
                (SELECT IFNULL(SUM(budget), 0) FROM projects WHERE manager_id = ?) AS totalBudget,
                (SELECT IFNULL(SUM(total_cost), 0) FROM costs c JOIN projects p ON c.project_id = p.project_id WHERE p.manager_id = ?) AS totalSpent
        `;
        
        const params = isAdmin ? [] : [managerId, managerId, managerId, managerId, managerId, managerId, managerId];
        const [rows] = await db.query(query, params);
        const data = rows[0];

        const totalProjects = Number(data.totalProjects || 0);
        const completedProjects = Number(data.completedProjects || 0);
        const totalCapacityPool = Number(data.total_capacity_pool || 0);
        const actualUnitsUsed = Number(data.actual_units_used || 0);
        const totalBudget = Number(data.totalBudget || 0);
        const totalSpent = Number(data.totalSpent || 0);

        const successRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;
        const resourceEfficiency = totalCapacityPool > 0 ? Math.round((actualUnitsUsed / totalCapacityPool) * 100) : 0;
        const budgetVariance = totalBudget > 0 ? Math.round(((totalBudget - totalSpent) / totalBudget) * 100) : 0;

        res.json({ 
            totalProjects, 
            activeProjects: Number(data.activeProjects || 0),
            completedProjects,
            successRate, 
            resourceEfficiency: Math.min(resourceEfficiency, 100), 
            budgetVariance,
            totalSpent,
            totalBudget,
            allocatedCount: actualUnitsUsed,
            totalPool: totalCapacityPool
        });

    } catch (error) {
        console.error("REPORT STATS ERROR:", error.message);
        res.status(500).json({ error: "Failed to fetch report statistics" });
    }
};

// 2. 6-Month Trend (Line Chart)
exports.getUtilizationTrend = async (req, res) => {
    try {
        const managerId = req.user.id;
        const isAdmin = req.user.role === 'admin';
        
        // Ensure the chart query doesn't crash on strict SQL modes
        await db.query("SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");

        // Baseline capacity for the trend chart
        const [resourceRows] = await db.query("SELECT COUNT(*) * 10 as capacity FROM resources");
        const totalCapacity = (resourceRows[0] && resourceRows[0].capacity > 0) ? resourceRows[0].capacity : 100;

        const query = isAdmin ? `
            SELECT 
                DATE_FORMAT(pra.created_at, '%b') as monthName,
                SUM(pra.allocated_units) as units
            FROM project_resource_allocations pra
            WHERE pra.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
            GROUP BY YEAR(pra.created_at), MONTH(pra.created_at)
            ORDER BY YEAR(pra.created_at) ASC, MONTH(pra.created_at) ASC
        ` : `
            SELECT 
                DATE_FORMAT(pra.created_at, '%b') as monthName,
                SUM(pra.allocated_units) as units
            FROM project_resource_allocations pra
            JOIN projects p ON pra.project_id = p.project_id
            WHERE p.manager_id = ?
            AND pra.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
            GROUP BY YEAR(pra.created_at), MONTH(pra.created_at)
            ORDER BY YEAR(pra.created_at) ASC, MONTH(pra.created_at) ASC
        `;
        
        const params = isAdmin ? [] : [managerId];
        const [rows] = await db.query(query, params);

        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            months.push(d.toLocaleString('default', { month: 'short' }));
        }

        const trendData = months.map(m => {
            const found = rows.find(r => r.monthName === m);
            const units = found ? Number(found.units) : 0;
            const utilization = Math.round((units / totalCapacity) * 100);
            return {
                monthName: m,
                utilization: Math.min(utilization, 100),
                capacity: 100
            };
        });

        res.json(trendData);

    } catch (error) {
        console.error("TREND ERROR:", error.message);
        res.status(500).json({ error: "Failed to fetch trend data" });
    }
};

// 3. Cost Analysis (Bar Chart)
exports.getCostAnalysis = async (req, res) => {
    try {
        const managerId = req.user.id;
        const isAdmin = req.user.role === 'admin';
        
        const totalsQuery = isAdmin ? `
            SELECT 
                (SELECT IFNULL(SUM(budget), 0) FROM projects) AS totalBudget,
                (SELECT IFNULL(SUM(total_cost), 0) FROM costs) AS totalSpent
        ` : `
            SELECT 
                (SELECT IFNULL(SUM(budget), 0) FROM projects WHERE manager_id = ?) AS totalBudget,
                (SELECT IFNULL(SUM(total_cost), 0) FROM costs c JOIN projects p ON c.project_id = p.project_id WHERE p.manager_id = ?) AS totalSpent
        `;
        const totalsParams = isAdmin ? [] : [managerId, managerId];
        const [totalsRows] = await db.query(totalsQuery, totalsParams);
        const totals = totalsRows[0];

        const categoryQuery = isAdmin ? `
            SELECT 
                IFNULL(r.resource_name, 'Other') as name,
                SUM(c.total_cost) as totalSpent,
                (SELECT IFNULL(SUM(p.budget), 0) / 4 FROM projects p) as totalBudget
            FROM costs c
            LEFT JOIN resources r ON c.resource_id = r.resource_id
            GROUP BY name
            ORDER BY totalSpent DESC
        ` : `
            SELECT 
                IFNULL(r.resource_name, 'Other') as name,
                SUM(c.total_cost) as totalSpent,
                (SELECT IFNULL(SUM(p.budget), 0) / 4 FROM projects p WHERE p.manager_id = ?) as totalBudget
            FROM costs c
            JOIN projects p ON c.project_id = p.project_id
            LEFT JOIN resources r ON c.resource_id = r.resource_id
            WHERE p.manager_id = ?
            GROUP BY name
            ORDER BY totalSpent DESC
        `;
        
        const categoryParams = isAdmin ? [] : [managerId, managerId];
        const [rows] = await db.query(categoryQuery, categoryParams);

        res.json({ 
            summary: {
                totalBudget: Number(totals.totalBudget || 0), 
                totalSpent: Number(totals.totalSpent || 0), 
                variance: Number(totals.totalBudget || 0) - Number(totals.totalSpent || 0)
            },
            chartData: rows.map(d => ({
                name: d.name,
                totalBudget: Number(d.totalBudget || 0),
                totalSpent: Number(d.totalSpent || 0)
            }))
        });
    } catch (error) {
        console.error("COST ANALYSIS ERROR:", error.message);
        res.status(500).json({ error: "Failed to fetch cost analysis" });
    }
};