import { createBrowserRouter } from "react-router-dom";
import Login from "./Login";
import Home from "./Home";
import Chat from "./Chat";

const router = createBrowserRouter([
    {
        path:"/",
        element:(
           <Home/>
        ),
    },
    {
        path:"/login/oauth",
        element: <Login/>
    }, {
        path:"/chat",
        element:<Chat/>
    }
])

export default router