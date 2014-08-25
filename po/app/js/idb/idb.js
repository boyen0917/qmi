$(function(){

    init = function(){

        idb_timeline_events = new IDBStore({
          dbVersion: 3,
          storeName: 'timeline_events',
          keyPath: 'ct_ei',
          indexes: [
            { name: 'gi'},
            { name: 'gi_ct',keyPath:['gi','ct']}
          ]
        });

        // idb_timeline_events2 = new IDBStore({
        //   dbVersion: 1,
        //   storeName: 'timeline_events2',
        //   keyPath: 'ct_ei',
        //   indexes: [
        //     { name: 'gi_ct',keyPath:['gi','ct']}
        //   ]
        // });

    }
 
    //do it
    init();
});