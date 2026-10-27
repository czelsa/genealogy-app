import 'fake-indexeddb/auto';

URL.createObjectURL = () => 'blob:mock-url';
URL.revokeObjectURL = () => {};
