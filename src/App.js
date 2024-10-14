import { Routes, Route } from "react-router-dom";
import "./App.css";
import { UserAuthContextProvider } from "./context/UserAuthContext";
import Main from "./components/main";
import Comments from "./components/comments";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/login";

function App() {
  return (
    <>
      <UserAuthContextProvider>
        <Routes>
          <Route
            path="/comments"
            element={
              <ProtectedRoute>
                <Comments />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Main />} />
          <Route path="/login" element={<Login />} />
          {/*<Route path="/signup" element={<Signup />} />*/}
        </Routes>
      </UserAuthContextProvider>
    </>
  );
}

export default App;
