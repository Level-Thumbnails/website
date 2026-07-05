import { computed, ref } from 'vue';

type ModalKind = 'alert' | 'confirm';

interface ModalRequest {
    id: number;
    kind: ModalKind;
    title: string;
    message: string;
    resolve: (value: boolean) => void;
}

const modalQueue = ref<ModalRequest[]>([]);
let nextModalId = 0;

export const activeModal = computed(() => modalQueue.value[0] ?? null);

function enqueueModal(kind: ModalKind, title: string, message: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        modalQueue.value.push({
            id: nextModalId++,
            kind,
            title,
            message,
            resolve,
        });
    });
}

export function completeActiveModal(value: boolean) {
    const current = modalQueue.value.shift();
    if (!current) return;

    current.resolve(value);
}

export async function alertModal(title: string, message: string): Promise<void> {
    await enqueueModal('alert', title, message);
}

export async function confirmModal(title: string, message: string): Promise<boolean> {
    return await enqueueModal('confirm', title, message);
}