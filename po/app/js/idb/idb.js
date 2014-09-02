$(function(){

    init = function(){
      
        idb_timeline_events = new IDBStore({
          dbVersion: 1,
          storeName: 'timeline_events',
          keyPath: 'ei',
          indexes: [
            { name: 'gi_ct',keyPath:['gi','ct']},
            { name: 'gi_tp_ct',keyPath:['gi','tp','ct']}
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