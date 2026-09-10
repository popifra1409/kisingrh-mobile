import { getQueue, removeFromQueue, markFailed, QueueItem } from './queue';
import { deletePersistedFile } from './fileStorage';
import { updateProfile } from '../api/profile';
import { createLeave, NewLeavePayload } from '../api/leaves';
import { extractApiError } from '../api/client';

export interface SyncResult {
    succeeded: number;
    failed: number;
    total: number;
}

async function processItem(item: QueueItem): Promise<void> {
    switch (item.type) {
        case 'update_profile':
            await updateProfile(item.payload as any);
            break;

        case 'create_leave': {
            const payload = item.payload as unknown as NewLeavePayload & { _persistedFileUri?: string; _fileName?: string; _fileType?: string };
            const documentFile = payload._persistedFileUri
                ? { uri: payload._persistedFileUri, name: payload._fileName ?? 'document', type: payload._fileType ?? 'application/octet-stream' }
                : undefined;

            await createLeave({ ...payload, documentFile });

            if (payload._persistedFileUri) {
                await deletePersistedFile(payload._persistedFileUri);
            }
            break;
        }

        default:
            throw new Error(`Type d'action inconnu : ${item.type}`);
    }
}

export async function processQueue(): Promise<SyncResult> {
    const queue = await getQueue();
    let succeeded = 0;
    let failed = 0;

    for (const item of queue) {
        try {
            await processItem(item);
            await removeFromQueue(item.id);
            succeeded++;
        } catch (error) {
            await markFailed(item.id, extractApiError(error).message);
            failed++;
        }
    }

    return { succeeded, failed, total: queue.length };
}