import * as FileSystem from 'expo-file-system/legacy';

const OFFLINE_DIR = FileSystem.documentDirectory + 'offline-uploads/';

async function ensureDir() {
    const info = await FileSystem.getInfoAsync(OFFLINE_DIR);
    if (!info.exists) {
        await FileSystem.makeDirectoryAsync(OFFLINE_DIR, { intermediates: true });
    }
}

export async function persistPickedFile(
    sourceUri: string,
    fileName: string
): Promise<string> {
    await ensureDir();
    const destUri = OFFLINE_DIR + `${Date.now()}-${fileName}`;
    await FileSystem.copyAsync({ from: sourceUri, to: destUri });
    return destUri;
}

export async function deletePersistedFile(uri: string): Promise<void> {
    try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch {
        // pas grave si déjà supprimé
    }
}