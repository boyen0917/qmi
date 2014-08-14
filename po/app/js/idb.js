$(function(){

    init = function(){
        timeline_events = new IDBStore({
          dbVersion: 1,
          storeName: 'timeline_events',
          keyPath: 'ei',
          indexes: [
            { name: 'ei'},
            { name: 'ct'}
          ]
        });

        //
        users = new IDBStore({
          dbVersion: 1,
          storeName: 'users',
          keyPath: 'ui',
          indexes: [
            { name: 'ui'}
          ]
        });

        groups = new IDBStore({
          dbVersion: 1,
          storeName: 'groups',
          keyPath: 'gi',
          indexes: [
            { name: 'gi'}
          ]
        });
    }

    //do it
    init();
});