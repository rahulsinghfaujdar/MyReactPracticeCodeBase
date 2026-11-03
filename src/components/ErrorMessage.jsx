import React from 'react';

const ErrorMessage = React.memo((props) => {

  return(
    <h1 style={{ color: '#000', fontSize: '14px', alignSelf:'center' }}>{props?.message || 'Error'}</h1>
  );
})

export default ErrorMessage;