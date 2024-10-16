import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap

const HomePage = () => {
  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="col-md-4">
        <div className="card shadow-lg p-3 mb-5 bg-body rounded">
          <div className="card-body">
            <h1 className="card-title text-center mb-4">GymKube</h1>
            <h3 className="text-center mb-4" >Welcome to GymKube Web Portal</h3>
            <div className="text-center">
              <a href="/login" className="btn btn-primary w-100 d-block mb-2">Login</a>
              <a href="/register" className="btn btn-secondary w-100 d-block">Register</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;