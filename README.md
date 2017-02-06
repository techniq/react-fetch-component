# react-fetch-component

React component to declaratively fetch data

## Install
```
yarn add react-fetch-component
```
or
```
npm install --save react-fetch-component
```

## Usage

### Import
```js
import Fetch from 'react-fetch-component'
```

### Basic
```js
<Fetch url="someUrl">
  { ({ loading, error, data }) => (
    <div>
      { loading && "Loading..." }
      { error && error.toString()} }
      { data && (
        {/* handle data here */}
      )}
    </div>
  )}
</Fetch>
``` 

### Include credentials
```js
<Fetch url="someUrl" options={{ credentials: 'include' }}>
  {/* ... */}
</Fetch>
```
