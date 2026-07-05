<script setup lang="ts">
import { computed } from 'vue';

export interface ModalButton {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}

interface Props {
  open: boolean;
  title: string;
  buttons?: ModalButton[];
  dialogClass?: string;
}

interface Emits {
  (e: 'close'): void;
  (e: 'action', index: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  buttons: () => [],
  dialogClass: '',
});

const emit = defineEmits<Emits>();

const resolvedButtons = computed(() =>
  props.buttons.map((btn, idx) => ({
    ...btn,
    variant: btn.variant || (idx === props.buttons.length - 1 ? 'primary' : 'secondary'),
    disabled: btn.disabled ?? false,
    loading: btn.loading ?? false,
  }))
);

function handleAction(index: number) {
  emit('action', index);
}

function getButtonClass(btn: ModalButton & { variant: 'primary' | 'secondary' | 'danger' }) {
  return {
    'btn': true,
    [`btn-${btn.variant}`]: true,
    'btn-sm': true,
  };
}
</script>

<template>
  <Teleport to="body" v-if="open">
    <div class="modal-overlay" @click="$emit('close')">
      <div class="modal-dialog" :class="props.dialogClass" @click.stop>
        <div class="modal-header">
          <h2>{{ title }}</h2>
          <button type="button" class="modal-close" @click="$emit('close')">✕</button>
        </div>

        <div class="modal-body">
          <slot />
        </div>

        <div v-if="resolvedButtons.length > 0" class="modal-footer">
          <button
            v-for="(btn, idx) in resolvedButtons"
            :key="idx"
            :class="getButtonClass(btn)"
            :disabled="btn.disabled || btn.loading"
            @click="handleAction(idx)"
          >
            {{ btn.loading ? '...' : btn.label }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  backdrop-filter: blur(4px);
}

.modal-dialog {
  background: rgba(0, 0, 0, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  max-width: 500px;
  width: 90%;
  overflow: hidden;
}

.modal-dialog.modal-dialog--fullscreen {
  max-width: none;
  width: 100vw;
  height: 100vh;
  border-radius: 0;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
}

.modal-close {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
}

.modal-close:hover {
  color: #fff;
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 60vh;
  overflow-y: auto;
}

.modal-dialog.modal-dialog--fullscreen .modal-body {
  flex: 1;
  max-height: none;
}

.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.modal-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

.modal-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 14px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.btn {
  padding: 8px 16px;
  font-size: 0.9rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.15s;
  font-weight: 500;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: rgba(78, 159, 255, 0.15);
  color: #7eb3ff;
  border-color: rgba(78, 159, 255, 0.3);
}

.btn-primary:not(:disabled):hover {
  background: rgba(78, 159, 255, 0.25);
  border-color: rgba(78, 159, 255, 0.5);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.1);
}

.btn-secondary:not(:disabled):hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.btn-danger {
  background: rgba(255, 109, 109, 0.15);
  color: #ffb8b8;
  border-color: rgba(255, 109, 109, 0.3);
}

.btn-danger:not(:disabled):hover {
  background: rgba(255, 109, 109, 0.25);
  border-color: rgba(255, 109, 109, 0.5);
}

.btn-sm {
  padding: 7px 12px;
  font-size: 0.88rem;
  border-radius: 10px;
  min-width: 38px;
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.12s, opacity 0.12s;
}

.btn-sm:not(:disabled):hover {
  transform: translateY(-1px);
}

.btn-sm:disabled {
  opacity: 0.5;
}
</style>


