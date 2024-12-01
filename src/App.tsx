import { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';
import { Authenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from "aws-amplify/auth";
import { BedrockRuntimeClient, InvokeModelCommand, ConverseCommand } from "@aws-sdk/client-bedrock-runtime"
import ingredients from './ingredients'
import { claude_haiku } from './modelIds';
import './App.css'
import '@aws-amplify/ui-react/styles.css';
Amplify.configure(outputs);

function App() {
  const [recipes, setRecipes] = useState([])
  const [conversation, setConversation] = useState([])
  const [modelId, setModelId] = useState(null)
  const [recipeNames, setRecipeNames] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    (async () => {
      await getBreakfastSuggestions()
    })()
  }, [])
  return (
    <>
      <div className="p-4">
        <Authenticator>
          <h1 className="text-2xl">Breakfast</h1><br />
          {isLoading && (
            <div className='text-center w-screen' role="status">
              <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
          )}
          {!isLoading && (
            <>
              <ul className="menu bg-base-200 rounded-box">
                {recipes.map((x, i) => (
                  <li key={i}><a>{x.name}</a></li>
                ))}
              </ul>
            </>
          )}
          <button className='btn btn-primary w-screen mt-3'
            onClick={async () => { await getBreakfastSuggestions() }}
          >Generate More</button>
        </Authenticator>
      </div>
    </>
  )
  async function getBreakfastSuggestions(modelId = claude_haiku) {
    setIsLoading(true)
    const start = performance.now()
    const session = await fetchAuthSession();
    let region = session.identityId.split(":")[0];
    const client = new BedrockRuntimeClient({ region: region, credentials: session.credentials });
    const ingredientsType = {
      name: "string",
      ingredients: "string[]",
      steps: "string[]"
    }
    const systemPrompts = [{
      text: `
        You are an expert on suggesting recipes.
        \nMake sure to suggest recipes that are safe to eat, and do not experiment, stay within recipes created by humans in your knowledge.
        \nLastly, return your response in an array of objects only, without any preceding message nor description, following the type specification below:
        \n\n${JSON.stringify(ingredientsType)}
      `
    }]
    const requestMessage = `
      Given the ingredients below, can you give me 5 breakfast recipes, preferring Filipino breakfast recipes:
      \n${JSON.stringify(ingredients)}

      Please do not repeat any recipes you have previously given.
      You can begin to suggest non-filipino recipes if you have ran out of filipino recipes.
    `
    const newMessage = {
      role: "user",
      content: [{ text: requestMessage }]
    }
    const messages = [...conversation, newMessage]
    console.log('request messages', messages)
    const response = await generateConversation({
      bedrockClient: client,
      modelId: modelId,
      systemPrompts: systemPrompts,
      messages: messages
    })
    const responseMessage = response.output.message;
    const updatedConversation = [...messages, responseMessage]
    setConversation(updatedConversation)
    console.log('updated conversation', updatedConversation)
    const newRecipes = JSON.parse(responseMessage.content[0].text);
    console.log('newRecipes', newRecipes)
    const updatedRecipes = [...recipes, ...newRecipes];
    setRecipes(updatedRecipes)
    console.log('updatedRecipes', updatedRecipes)
    const end = performance.now()
    console.log(`response time: ${(end - start) / 1000} seconds`)
    setIsLoading(false)
  }
  async function generateConversation({ bedrockClient, modelId, systemPrompts, messages }) {
    // Prepare request
    const inferenceConfig = { temperature: 0.5, topP: 0.5 };
    const input = { modelId: modelId, messages: messages, system: systemPrompts, inferenceConfig: inferenceConfig };
    const command = new ConverseCommand(input);
    // Get response
    const response = await bedrockClient.send(command);
    return response;
  }
}

export default App
