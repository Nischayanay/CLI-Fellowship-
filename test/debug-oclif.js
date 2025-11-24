console.log('Start import');
import('@oclif/core').then(() => {
    console.log('Import success');
}).catch(e => {
    console.error('Import failed', e);
});
