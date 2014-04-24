<?php
$datas = array(
    array('id' => 1, 'parent' => 0, 'name' => 'Page 1'),
    array('id' => 2, 'parent' => 1, 'name' => 'Page 1.1'),
    array('id' => 3, 'parent' => 2, 'name' => 'Page 1.1.1'),
    array('id' => 4, 'parent' => 3, 'name' => 'Page 1.1.1.1'),
    array('id' => 5, 'parent' => 3, 'name' => 'Page 1.1.1.2'),
    array('id' => 6, 'parent' => 1, 'name' => 'Page 1.2'),
    array('id' => 7, 'parent' => 6, 'name' => 'Page 1.2.1'),
    array('id' => 8, 'parent' => 0, 'name' => 'Page 2'),
    array('id' => 9, 'parent' => 0, 'name' => 'Page 3'),
    array('id' => 10, 'parent' => 9, 'name' => 'Page 3.1'),
    array('id' => 11, 'parent' => 9, 'name' => 'Page 3.2'),
    array('id' => 12, 'parent' => 11, 'name' => 'Page 3.2.1'),
    );

function generatePageTree($datas, $parent = 0, $limit=0){
    if($limit > 1000) return ''; // Make sure not to have an endless recursion
    $tree = '<ul>';
    for($i=0, $ni=count($datas); $i < $ni; $i++){
        if($datas[$i]['parent'] == $parent){
            $tree .= '<li>';
            $tree .= $datas[$i]['name'];
            $tree .= generatePageTree($datas, $datas[$i]['id'], $limit++);
            $tree .= '</li>';
        }
    }
    $tree .= '</ul>';
    return $tree;
}

echo(generatePageTree($datas));

?>