import React from 'react';

const SearchInput = React.memo((props) => {
  const searchValue = props?.value || '';
  const placeholder = 'Search Here...';
  const onSearchTextChange = props?.onSearchTextChange;
  return(
    <input 
      value={searchValue}
      placeholder={placeholder}
      onChange={(event) => onSearchTextChange?.(event)}
      style={{height:'40px', width:'100%'}}
    />
  );
})

export default SearchInput;