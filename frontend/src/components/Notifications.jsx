import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Styles/Notifications.css';

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5005/api/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5005/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => n.notification_id === id ? { ...n, is_read: 1 } : n));
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5005/api/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
        } catch (err) {
            console.error(err);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHrs / 24);

        if (diffHrs < 1) return 'Just now';
        if (diffHrs < 24) return `${diffHrs} hours ago`;
        if (diffDays === 1) return '1 day ago';
        return `${diffDays} days ago`;
    };

    const getIconDetails = (type) => {
        switch (type) {
            case 'critical':
                return { icon: '!', colorClass: 'icon-critical' };
            case 'warning':
                return { icon: '📅', colorClass: 'icon-warning' };
            case 'success':
                return { icon: '✔️', colorClass: 'icon-success' };
            case 'info':
            default:
                return { icon: 'ℹ️', colorClass: 'icon-info' };
        }
    };

    const total = notifications.length;
    const unread = notifications.filter(n => !n.is_read).length;
    const critical = notifications.filter(n => n.type === 'critical').length;
    const warnings = notifications.filter(n => n.type === 'warning').length;

    return (
        <div className="notifications-page">
            <div className="back-link" onClick={() => navigate('/manager-dashboard')}>
                <span className="back-arrow">&larr;</span> Back to Dashboard
            </div>
            
            <div className="notifications-header">
                <div className="header-titles">
                    <h2>Notifications</h2>
                    <p>Stay updated with system alerts and updates</p>
                </div>
                <button className="mark-all-btn" onClick={markAllAsRead}>Mark all as read</button>
            </div>

            <div className="stats-cards-container">
                <div className="stat-card">
                    <div className="stat-card-top">
                        <div className="stat-icon-wrapper total-icon">
                            <i className="fas fa-bell"></i>
                        </div>
                        <div className="stat-text">Total</div>
                    </div>
                    <div className="stat-value">{total}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-top">
                        <div className="stat-icon-wrapper unread-icon">
                            <i className="far fa-bell"></i>
                        </div>
                        <div className="stat-text">Unread</div>
                    </div>
                    <div className="stat-value">{unread}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-top">
                        <div className="stat-icon-wrapper critical-icon">
                            <i className="fas fa-exclamation-circle"></i>
                        </div>
                        <div className="stat-text">Critical</div>
                    </div>
                    <div className="stat-value">{critical}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-top">
                        <div className="stat-icon-wrapper warning-icon">
                            <i className="far fa-calendar-alt"></i>
                        </div>
                        <div className="stat-text">Warnings</div>
                    </div>
                    <div className="stat-value">{warnings}</div>
                </div>
            </div>

            <div className="notifications-list-box">
                <h3 className="list-title">All Notifications</h3>
                {loading ? (
                    <p className="loading-text">Loading notifications...</p>
                ) : notifications.length === 0 ? (
                    <p className="loading-text">No notifications found.</p>
                ) : (
                    <div className="list-items-container">
                        {notifications.map((notif, index) => {
                            const { icon, colorClass } = getIconDetails(notif.type);
                            let displayIcon = icon;
                            let displayColor = colorClass;
                            
                            // Map specific text to look exactly like the screenshot examples
                            if (notif.title.includes('Budget')) { displayIcon = '$'; displayColor = 'icon-budget'; }
                            else if (notif.title.includes('Deadline')) { displayIcon = '📅'; displayColor = 'icon-warning'; }
                            else if (notif.title.includes('Completed')) { displayIcon = '✔️'; displayColor = 'icon-success'; }
                            else if (notif.title.includes('Team')) { displayIcon = '👥'; displayColor = 'icon-team'; }
                            else if (notif.title.includes('Resource') || notif.title.includes('Conflict')) { displayIcon = '!'; displayColor = 'icon-critical'; }
                            else if (notif.title.includes('Update')) { displayIcon = 'i'; displayColor = 'icon-info'; }

                            // Make sure the last item doesn't have a bottom border
                            const isLast = index === notifications.length - 1;

                            return (
                                <div key={notif.notification_id} className={`notification-item ${isLast ? 'last-item' : ''}`}>
                                    <div className={`notification-icon ${displayColor}`}>
                                        {displayIcon}
                                    </div>
                                    <div className="notification-content">
                                        <div className="notification-title">{notif.title}</div>
                                        <div className="notification-message">
                                            {notif.message}
                                        </div>
                                        <div className="notification-meta">
                                            <span className="time-ago">{formatTime(notif.created_at)}</span>
                                            {!notif.is_read && (
                                                <span className="mark-read-action" onClick={() => markAsRead(notif.notification_id)}>
                                                    Mark as read
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {!notif.is_read && <div className="unread-dot"></div>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
