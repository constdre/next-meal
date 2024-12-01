import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1 className="text-2xl">Hello Amplify-React-Vite-Tailwind-DaisyUI!</h1><br/>
      <ul className="menu bg-base-200 rounded-box w-56">
        <li><a>Item 1</a></li>
        <li><a>Item 2</a></li>
        <li><a>Item 3</a></li>
      </ul>
    </>
  )
}

export default App
