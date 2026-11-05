<script setup>
import { onMounted, ref } from "vue";
import ListServices from "../services/listServices.js";
import ListItemsDialog from "../components/ListItemsDialog.vue";

const lists = ref([]);
const loading = ref(false);
const errorMessage = ref("");

const addDialog = ref(false);
const addForm = ref(null);
const newName = ref("");
const addLoading = ref(false);

const renameDialog = ref(false);
const renameForm = ref(null);
const renameName = ref("");
const renamingList = ref(null);
const renameLoading = ref(false);

const deleteDialog = ref(false);
const deletingList = ref(null);
const deleteLoading = ref(false);

const itemsDialog = ref(false);
const itemsList = ref(null);

const nameRules = [(value) => !!value?.trim() || "List name is required."];

const loadLists = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const res = await ListServices.getLists();
    lists.value = res.data;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to load lists.";
  } finally {
    loading.value = false;
  }
};

onMounted(loadLists);

const openAddDialog = () => {
  newName.value = "";
  errorMessage.value = "";
  addDialog.value = true;
};

const createList = async () => {
  const { valid } = await addForm.value.validate();
  if (!valid) {
    return;
  }

  addLoading.value = true;
  errorMessage.value = "";
  try {
    await ListServices.createList({ name: newName.value.trim() });
    addDialog.value = false;
    newName.value = "";
    await loadLists();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to create list.";
  } finally {
    addLoading.value = false;
  }
};

const openRenameDialog = (list) => {
  renamingList.value = list;
  renameName.value = list.name;
  errorMessage.value = "";
  renameDialog.value = true;
};

const saveRename = async () => {
  const { valid } = await renameForm.value.validate();
  if (!valid) {
    return;
  }

  renameLoading.value = true;
  errorMessage.value = "";
  try {
    await ListServices.updateList(renamingList.value.id, {
      name: renameName.value.trim(),
    });
    renameDialog.value = false;
    await loadLists();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to rename list.";
  } finally {
    renameLoading.value = false;
  }
};

const openDeleteDialog = (list) => {
  deletingList.value = list;
  errorMessage.value = "";
  deleteDialog.value = true;
};

const openItemsDialog = (list) => {
  itemsList.value = list;
  itemsDialog.value = true;
};

const confirmDelete = async () => {
  deleteLoading.value = true;
  errorMessage.value = "";
  try {
    await ListServices.deleteList(deletingList.value.id);
    deleteDialog.value = false;
    await loadLists();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to delete list.";
  } finally {
    deleteLoading.value = false;
  }
};
</script>

<template>
  <v-container class="py-8">
    <v-row>
      <v-col cols="12" md="8" lg="6">
        <v-card elevation="4">
          <v-card-item>
            <v-card-title class="text-h5">My Lists</v-card-title>
            <template #append>
              <v-btn
                color="primary"
                variant="elevated"
                class="oc-cta"
                @click="openAddDialog"
              >
                + New List
              </v-btn>
            </template>
          </v-card-item>

          <v-card-text>
            <v-alert v-if="errorMessage" type="error" class="mb-4">
              {{ errorMessage }}
            </v-alert>

            <v-progress-linear v-if="loading" indeterminate class="mb-4" />

            <p v-else-if="lists.length === 0" class="text-body-1">
              No lists yet. Create your first list.
            </p>

            <v-list v-else>
              <v-list-item v-for="list in lists" :key="list.id" :title="list.name">
                <template #append>
                  <v-btn
                    icon="mdi-checkbox-marked-outline"
                    size="small"
                    variant="text"
                    aria-label="Items"
                    @click="openItemsDialog(list)"
                  />
                  <v-btn
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    aria-label="Edit list"
                    @click="openRenameDialog(list)"
                  />
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    aria-label="Delete list"
                    @click="openDeleteDialog(list)"
                  />
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="addDialog" max-width="480">
      <v-card>
        <v-card-item>
          <v-card-title>New List</v-card-title>
        </v-card-item>
        <v-card-text>
          <v-form ref="addForm" @submit.prevent="createList">
            <v-text-field
              v-model="newName"
              label="List name"
              :rules="nameRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="addDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="addLoading"
            @click="createList"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="renameDialog" max-width="480">
      <v-card>
        <v-card-item>
          <v-card-title>Rename List</v-card-title>
        </v-card-item>
        <v-card-text>
          <v-form ref="renameForm" @submit.prevent="saveRename">
            <v-text-field
              v-model="renameName"
              label="List name"
              :rules="nameRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="renameDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="renameLoading"
            @click="saveRename"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ListItemsDialog v-model="itemsDialog" :list="itemsList" />

    <v-dialog v-model="deleteDialog" max-width="480">
      <v-card>
        <v-card-item>
          <v-card-title>Delete List</v-card-title>
        </v-card-item>
        <v-card-text>
          Delete {{ deletingList?.name }}? This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="deleteDialog = false">
            Cancel
          </v-btn>
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
  </v-container>
</template>
