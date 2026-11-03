import React from 'react';

const EmptyMessage = React.memo((props) => {

  return(
    <h1 style={{ color: '#000', fontSize: '14px', alignSelf:'center' }}>No Data!!</h1>
  );
})

export default EmptyMessage;