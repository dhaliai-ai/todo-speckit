<script setup>
import { ref, watch } from "vue";
import TodoServices from "../services/todoServices.js";
import {
  formatDueDate,
  isTodoOverdue,
  optionalDueDateRules,
  toDateInputValue,
} from "../config/validation.js";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  list: { type: Object, default: null },
});

const emit = defineEmits(["update:modelValue"]);

const todos = ref([]);
const loading = ref(false);
const errorMessage = ref("");

const addDialog = ref(false);
const addForm = ref(null);
const newTitle = ref("");
const newDueDate = ref("");
const addLoading = ref(false);

const editDialog = ref(false);
const editForm = ref(null);
const editTitle = ref("");
const editDueDate = ref("");
const editingTodo = ref(null);
const editLoading = ref(false);

const deleteDialog = ref(false);
const deletingTodo = ref(null);
const deleteLoading = ref(false);

const titleRules = [(value) => !!value?.trim() || "Todo title is required."];

const close = () => {
  emit("update:modelValue", false);
};

const loadTodos = async () => {
  if (!props.list?.id) {
    todos.value = [];
    return;
  }

  loading.value = true;
  errorMessage.value = "";
  try {
    const res = await TodoServices.getTodos(props.list.id);
    todos.value = res.data;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to load todos.";
  } finally {
    loading.value = false;
  }
};

watch(
  () => [props.modelValue, props.list?.id],
  ([isOpen]) => {
    if (isOpen) {
      loadTodos();
    }
  }
);

const openAddDialog = () => {
  newTitle.value = "";
  newDueDate.value = "";
  errorMessage.value = "";
  addDialog.value = true;
};

const addTodo = async () => {
  const { valid } = await addForm.value.validate();
  if (!valid) {
    return;
  }

  addLoading.value = true;
  errorMessage.value = "";
  try {
    const payload = { title: newTitle.value.trim() };
    if (newDueDate.value) {
      payload.dueDate = newDueDate.value;
    }
    await TodoServices.createTodo(props.list.id, payload);
    addDialog.value = false;
    newTitle.value = "";
    newDueDate.value = "";
    await loadTodos();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to add todo.";
  } finally {
    addLoading.value = false;
  }
};

const toggleCompleted = async (todo, completed) => {
  errorMessage.value = "";
  try {
    await TodoServices.updateTodo(todo.id, { completed });
    await loadTodos();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to update todo.";
  }
};

const openEditDialog = (todo) => {
  editingTodo.value = todo;
  editTitle.value = todo.title;
  editDueDate.value = toDateInputValue(todo.dueDate);
  errorMessage.value = "";
  editDialog.value = true;
};

const saveEdit = async () => {
  const { valid } = await editForm.value.validate();
  if (!valid) {
    return;
  }

  editLoading.value = true;
  errorMessage.value = "";
  try {
    await TodoServices.updateTodo(editingTodo.value.id, {
      title: editTitle.value.trim(),
      dueDate: editDueDate.value ? editDueDate.value : null,
    });
    editDialog.value = false;
    await loadTodos();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to update todo.";
  } finally {
    editLoading.value = false;
  }
};

const openDeleteDialog = (todo) => {
  deletingTodo.value = todo;
  errorMessage.value = "";
  deleteDialog.value = true;
};

const confirmDelete = async () => {
  deleteLoading.value = true;
  errorMessage.value = "";
  try {
    await TodoServices.deleteTodo(deletingTodo.value.id);
    deleteDialog.value = false;
    await loadTodos();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to delete todo.";
  } finally {
    deleteLoading.value = false;
  }
};
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="640" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-item>
        <v-card-title>{{ list?.name }} — Items</v-card-title>
        <template #append>
          <v-btn color="primary" variant="elevated" class="oc-cta" @click="openAddDialog">
            + Add Item
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <v-alert v-if="errorMessage" type="error" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <v-progress-linear v-if="loading" indeterminate class="mb-4" />

        <p v-else-if="todos.length === 0" class="text-body-1">
          No todos in this list yet.
        </p>

        <v-list v-else>
          <v-list-item v-for="todo in todos" :key="todo.id">
            <template #prepend>
              <v-checkbox-btn
                :model-value="todo.completed"
                :aria-label="`Mark ${todo.title} complete`"
                @update:model-value="toggleCompleted(todo, $event)"
              />
            </template>
            <v-list-item-title :class="todo.completed ? 'text-medium-emphasis text-decoration-line-through' : ''">
              {{ todo.title }}
            </v-list-item-title>
            <v-list-item-subtitle v-if="todo.dueDate">
              <span :class="isTodoOverdue(todo) ? 'text-error' : ''">
                {{ formatDueDate(todo.dueDate) }}
              </span>
            </v-list-item-subtitle>
            <template #append>
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                aria-label="Edit todo"
                @click="openEditDialog(todo)"
              />
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                aria-label="Delete todo"
                @click="openDeleteDialog(todo)"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" variant="text" @click="close">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="addDialog" max-width="480">
    <v-card>
      <v-card-item>
        <v-card-title>Add Item</v-card-title>
      </v-card-item>
      <v-card-text>
        <v-form ref="addForm" @submit.prevent="addTodo">
          <v-text-field v-model="newTitle" label="Todo title" :rules="titleRules" class="mb-2" />
          <v-text-field
            v-model="newDueDate"
            label="Due date"
            type="date"
            :rules="optionalDueDateRules"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" variant="text" @click="addDialog = false">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          class="oc-cta"
          :loading="addLoading"
          @click="addTodo"
        >
          Add
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="editDialog" max-width="480">
    <v-card>
      <v-card-item>
        <v-card-title>Edit Item</v-card-title>
      </v-card-item>
      <v-card-text>
        <v-form ref="editForm" @submit.prevent="saveEdit">
          <v-text-field v-model="editTitle" label="Todo title" :rules="titleRules" class="mb-2" />
          <v-text-field
            v-model="editDueDate"
            label="Due date"
            type="date"
            :rules="optionalDueDateRules"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" variant="text" @click="editDialog = false">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          class="oc-cta"
          :loading="editLoading"
          @click="saveEdit"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="deleteDialog" max-width="480">
    <v-card>
      <v-card-item>
        <v-card-title>Delete Item</v-card-title>
      </v-card-item>
      <v-card-text>
        Delete {{ deletingTodo?.title }}? This cannot be undone.
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" variant="text" @click="deleteDialog = false">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          class="oc-cta"
          :loading="deleteLoading"
          @click="confirmDelete"
        >
          Delete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
