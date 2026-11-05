import apiClient from "./services.js";

const ListServices = {
  getLists() {
    return apiClient.get("lists");
  },

  createList(data) {
    return apiClient.post("lists", data);
  },

  updateList(listId, data) {
    return apiClient.put(`lists/${listId}`, data);
  },

  deleteList(listId) {
    return apiClient.delete(`lists/${listId}`);
  },
};

export default ListServices;
