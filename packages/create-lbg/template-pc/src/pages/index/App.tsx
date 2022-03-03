import React from 'react';
import Child from '@/pages/index/Child';

function App() {
    const [count, setCount] = React.useState(0);

    return (
        <div>
            parent
            {' '}
            {count}
            <button className="1" type="button" onClick={() => setCount(count + 1)}>
                +
            </button>
            <Child />
        </div>
    );
}

export default App;
