import api from "./api";

const API_URL = "/api/users";

export const getUsers = async () => {
  const response = await api.get(API_URL);
  return response.data;
};
