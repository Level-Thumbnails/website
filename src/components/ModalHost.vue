<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue';
import Modal, { type ModalButton } from './Modal.vue';
import { activeModal, completeActiveModal } from '../lib/modals';

const buttons = computed<ModalButton[]>(() => {
    if (!activeModal.value) return [];

    return activeModal.value.kind === 'confirm'
        ? [
            { label: 'Cancel', variant: 'secondary' },
            { label: 'OK', variant: 'primary' },
        ]
        : [{ label: 'OK', variant: 'primary' }];
});

function closeModal() {
    if (!activeModal.value) return;
    completeActiveModal(activeModal.value.kind !== 'confirm');
}

function handleAction(index: number) {
    if (!activeModal.value) return;

    if (activeModal.value.kind === 'confirm') {
        completeActiveModal(index === 1);
        return;
    }

    completeActiveModal(true);
}

let previousOverflow = '';

watch(
    activeModal,
    (modal) => {
        if (typeof document === 'undefined') return;

        if (modal) {
            if (previousOverflow === '') {
                previousOverflow = document.body.style.overflow;
            }
            document.body.style.overflow = 'hidden';
            return;
        }

        document.body.style.overflow = previousOverflow;
        previousOverflow = '';
    },
    { immediate: true }
);

onBeforeUnmount(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = previousOverflow;
});
</script>

<template>
    <Modal
        v-if="activeModal"
        :open="true"
        :title="activeModal.title"
        :buttons="buttons"
        @close="closeModal"
        @action="handleAction"
    >
        <p class="modal-message">{{ activeModal.message }}</p>
    </Modal>
</template>

<style scoped>
.modal-message {
    margin: 0;
    white-space: pre-wrap;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.92);
}
</style>