import {FormEvent} from "react";


type LoginFormProps = {
  loginHandle: (e: FormEvent) => void;
  setUsername: (username: string) => void;
  setPassword: (password: string) => void;
  closeModal: () => void;
  username: string;
  password: string;
}
const LoginForm = ({
                     loginHandle,
                     setUsername,
                     setPassword,
                     closeModal,
                     username,
                     password,
                   }: LoginFormProps) => {
  return (
    <form onSubmit={loginHandle} className="modal-form">
      <div className="form-group">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div className="form-group">
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="modal-actions">
        <button type="submit">Login</button>
        <button type="button" onClick={closeModal}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default LoginForm;