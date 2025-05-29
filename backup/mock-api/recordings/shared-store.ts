// Shared in-memory storage for recordings (in a real app, this would be a database)
export let recordings: any[] = [];
export let nextId = 1;

// Helper functions
export function addRecording(recording: any) {
  recordings.push(recording);
  return nextId++;
}

export function findRecordingById(id: string) {
  return recordings.find(r => r.id === id);
}

export function findRecordingIndexById(id: string) {
  return recordings.findIndex(r => r.id === id);
}

export function updateRecording(id: string, updates: any) {
  const index = findRecordingIndexById(id);
  if (index !== -1) {
    recordings[index] = { ...recordings[index], ...updates };
    return recordings[index];
  }
  return null;
}

export function deleteRecording(id: string) {
  const index = findRecordingIndexById(id);
  if (index !== -1) {
    return recordings.splice(index, 1)[0];
  }
  return null;
}

export function getAllRecordings() {
  return recordings;
}

export function getNextId() {
  return nextId;
} 