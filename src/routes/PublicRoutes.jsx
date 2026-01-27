import { Login } from "../Pages/Login"
import { Resetpassword } from "../Pages/Resetpassword"
import {Otp} from "../Pages/Otp"
import { Confirmpassword } from "../Pages/Confirmpassword"
import {Dashboard} from "../Pages/Dashboard"
import {Layout} from "../Layout/Layout"
import {Meetings} from "../Pages/Meetings"
import {Benefits} from "../Pages/Benefits"
import {Employees} from "../Pages/Employees"
import {Contracts} from "../Pages/Contracts"
import {News} from "../Pages/News"
import {Notifications} from "../Pages/Notifications"
import {Vote} from "../Pages/Vote"
import {Faq} from "../Pages/Faq"
import {Bell} from "../Pages/Bell"
import {Admin} from "../Pages/Admin"
import { DirectorUsers } from "../Pages/DirectorUsers"
import { RequireAuth } from "../auth/RequireAuth"
import { RequireRole } from "../auth/RequireRole"
export const publicRoutes = 
[
    {path:"/",element:<Login/>},
    {path:"/login",element:<Login/>},
    {path:"/resetpassword",element:<Resetpassword/>},
    {path:"/otp",element:<Otp/>},
    {path:"/confirmpassword",element:<Confirmpassword/>},
    // Sidebar layout with nested pages
  {
    path: "/layout",
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
        {path:"dashboard",element:<Dashboard/>},
        {path:"meetings",element:<Meetings/>},
        {path:"benefits",element:<Benefits/>},
        {path:"news",element:<News/>},
        {path:"vote",element:<Vote/>},
        {path:"notifications",element:<Notifications/>},
        {path:"faq",element:<Faq/>},
        {path:"bell",element:<Bell/>},
        {path:"employees",element:(<RequireRole roles={["director","principal","vice_principal"]}><Employees/></RequireRole>)},
        {path:"contracts",element:(<RequireRole roles={["director"]}><Contracts/></RequireRole>)},
        {path:"users",element:(<RequireRole roles={["director"]}><DirectorUsers/></RequireRole>)},
        {path:"admin",element:<Admin/>}
    ]
}
]
