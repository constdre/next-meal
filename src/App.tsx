import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';
import { Authenticator } from '@aws-amplify/ui-react';
import './App.css'
import '@aws-amplify/ui-react/styles.css';
Amplify.configure(outputs);

function App() {
  return (
    <>
      <div className="p-4">
        <Authenticator>
          <h1 className="text-2xl">Breakfast</h1><br />
          <ul className="menu bg-base-200 rounded-box">
            <li><a>Item 1</a></li>
            <li><a>Item 2</a></li>
            <li><a>Item 3</a></li>
          </ul>
        </Authenticator>
      </div>
    </>
  )
}

export default App
