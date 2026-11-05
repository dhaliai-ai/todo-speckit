import apiClient from "./services.js";

const TodoServices = {
  getTodos(listId) {
    return apiClient.get(`lists/${listId}/todos`);
  },

  createTodo(listId, data) {
    return apiClient.post(`lists/${listId}/todos`, data);
  },

  updateTodo(id, data) {
    return apiClient.put(`todos/${id}`, data);
  },

  deleteTodo(id) {
    return apiClient.delete(`todos/${id}`);
  },
};

export default TodoServices;
