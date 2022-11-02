import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div>
      <h1>Welcome to storyweb</h1>
      <Link to="/articles">articles</Link>
    </div>
  )
}
