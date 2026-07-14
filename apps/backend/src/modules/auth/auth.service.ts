import jwt from 'jsonwebtoken';

interface DemoUser {
  email: string;
  password: string;
  role: string;
}

const demoUsers: DemoUser[] = [
  { email: 'admin@example.com', password: 'admin123', role: 'admin' },
  { email: 'driver@example.com', password: 'driver123', role: 'driver' },
  { email: 'passenger@example.com', password: 'passenger123', role: 'passenger' },
];

export const generateToken = (userId: string, role: string): string => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '30d' }
  );
};

export const loginUser = async (authData: { email: string; password: string }) => {
  const { email, password } = authData;

  const user = demoUsers.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());

  if (!user || user.password !== password) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken(user.email, user.role);

  return {
    user: {
      email: user.email,
      role: user.role,
    },
    token,
  };
};