import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@kisingrh/offline_queue';

export type QueueActionType = 'update_profile' | 'create_leave';

export interface QueueItem {
    id: string;
    type: QueueActionType;
    payload: Record<string, unknown>;
    createdAt: string;
    status: 'pending' | 'failed';
    lastError?: string;
}

export async function getQueue(): Promise<QueueItem[]> {
    try {
        const raw = await AsyncStorage.getItem(QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

async function saveQueue(queue: QueueItem[]): Promise<void> {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueue(type: QueueActionType, payload: Record<string, unknown>): Promise<QueueItem> {
    const queue = await getQueue();
    const item: QueueItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        payload,
        createdAt: new Date().toISOString(),
        status: 'pending',
    };
    queue.push(item);
    await saveQueue(queue);
    return item;
}

export async function removeFromQueue(id: string): Promise<void> {
    const queue = await getQueue();
    await saveQueue(queue.filter((item) => item.id !== id));
}

export async function markFailed(id: string, errorMessage: string): Promise<void> {
    const queue = await getQueue();
    const updated = queue.map((item) =>
        item.id === id ? { ...item, status: 'failed' as const, lastError: errorMessage } : item
    );
    await saveQueue(updated);
}

export async function getQueueCount(): Promise<number> {
    const queue = await getQueue();
    return queue.length;
}