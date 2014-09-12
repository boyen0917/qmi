$(function(){

    init = function(){
      
        idb_timeline_events = new IDBStore({
          dbVersion: 5,
          storeName: 'timeline_events',
          keyPath: 'ei',
          indexes: [
            { name: 'gi_ct',keyPath:['gi','ct']},
            { name: 'gi_tp_ct',keyPath:['gi','tp','ct']}
          ]
        });

    }
 
    //do it
    init();
});