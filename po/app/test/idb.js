$(function(){init=function(){timeline_events=new IDBStore({dbVersion:1,storeName:'timeline_events',keyPath:'event_id',indexes:[{name:'event_id'}]});users=new IDBStore({dbVersion:1,storeName:'users',keyPath:'user_id',indexes:[{name:'event_id'}]});groups=new IDBStore({dbVersion:1,storeName:'groups',keyPath:'group_id',indexes:[{name:'group_id'}]})}init()});

// $(function(){

//     init = function(){
//         timeline_events = new IDBStore({
//           dbVersion: 1,
//           storeName: 'timeline_events',
//           keyPath: 'event_id',
//           indexes: [
//             { name: 'event_id'}
//           ]
//         });

//         //
//         users = new IDBStore({
//           dbVersion: 1,
//           storeName: 'users',
//           keyPath: 'user_id',
//           indexes: [
//             { name: 'event_id'}
//           ]
//         });

//         groups = new IDBStore({
//           dbVersion: 1,
//           storeName: 'groups',
//           keyPath: 'group_id',
//           indexes: [
//             { name: 'group_id'}
//           ]
//         });
//     }

//     //do it
//     init();
// });