import { useState } from "react";
import styles from "./main.module.css";
import { Link, useNavigate } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext";

const Login = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { logIn } = useUserAuth();
  let navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await logIn(email, password);
      navigate("/comments");
    } catch (err) {
      setError(err.message);
    }
  };

  const goToSignUp = () => {
    navigate("/");
  };

  return (
    <div className={styles.main}>
      <div className={styles.gradientImage}></div>
      <div className={styles.stars_top}></div>
      <div className={styles.stars_bottom}></div>
      <div className={styles.content_wrapper}>
        <div className={styles.form}>
          <h1>Sign In</h1>
          <p className={styles.subtitle}>
            Ready to become part of the exclusive club? Fill in the details
            below, and let the journey begin!
          </p>
          <form className={styles.form_inputs} onSubmit={handleSubmit}>
            <div className={styles.input_wrapper}>
              <input onChange={(e) => setEmail(e.target.value)} />
              <span className={`${email.length == 0 ? "" : styles.fill} emai;`}>
                Email Address
              </span>
            </div>
            <div className={styles.input_wrapper}>
              <input onChange={(e) => setPassword(e.target.value)} />
              <span className={password.length == 0 ? "" : styles.fill}>
                Password
              </span>
            </div>
            <div className={styles.input_wrapper}>
              <input onChange={(e) => setConfirmPassword(e.target.value)} />
              <span className={confirmPassword.length == 0 ? "" : styles.fill}>
                Confirm Password
              </span>
            </div>
            <button type="submit" className={styles.button}>
              Sign in
            </button>
          </form>
          {/*<fieldset>
            <legend>Full Name</legend>
            <input type="text" name="name" placeholder="Name" />
          </fieldset>*/}
        </div>
        <div className={styles.footer}>
          Don’t have account?{" "}
          <button onClick={() => goToSignUp()}>Sign Up</button>
        </div>
      </div>
    </div>
  );
};

export default Login;
