import { jest } from '@jest/globals';
import {fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import axios from 'axios';
import App from '../src/App';
import { TaskType } from '../src/types/task.type';
import MockAdapter from 'axios-mock-adapter';
import {API_URL} from "../src/constants";
import {toast} from "react-toastify";

const mockAxios = new MockAdapter(axios);
jest.mock('react-toastify', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

jest.mock('../src/constants', () => ({
  API_URL: 'http://localhost:5000',
}));

const mockJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NSIsIm5hbWUiOiJUZXN0IFVzZXIifQ.c2lnbmF0dXJl';

describe('App Component', () => {
  const mockTasks: TaskType[] = [
    { id: 1, title: 'Task 1', description: 'Desc 1', status: 'backlog' },
    { id: 2, title: 'Task 2', description: 'Desc 2', status: 'in-progress' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders login/register buttons when not authenticated', () => {
    render(<App />);
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('fetches and displays tasks when authenticated', async () => {
    localStorage.setItem('accessToken', `Bearer ${mockJwtToken}`);
    localStorage.setItem('refreshToken', 'mocked-refresh-token');
    mockAxios.onGet(`${API_URL}/tasks`).reply(200, { status: 'OK', data: mockTasks });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });

  it('filters tasks by search query', async () => {
    localStorage.setItem('accessToken', `Bearer ${mockJwtToken}`);
    localStorage.setItem('refreshToken', 'mocked-refresh-token');
    mockAxios.onGet(`${API_URL}/tasks`).reply(200, { status: 'OK', data: mockTasks });

    render(<App />);

    await waitFor(() => screen.getByText('Task 1'));
    fireEvent.change(screen.getByPlaceholderText('Search tasks...'), { target: { value: 'Task 1' } });

    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
  });

  it('opens add task modal', async () => {
    localStorage.setItem('accessToken', `Bearer ${mockJwtToken}`);
    localStorage.setItem('refreshToken', 'mocked-refresh-token');
    mockAxios.onGet(`${API_URL}/tasks`).reply(200, { status: 'OK', data: mockTasks });

    render(<App />);

    await waitFor(() => screen.getByText('Task 1'));
    fireEvent.click(screen.getByText('+ Add Task'));

    expect(screen.getByText('Add New Task')).toBeInTheDocument();
  });

  it('adds a new task', async () => {
    localStorage.setItem('accessToken', `Bearer ${mockJwtToken}`);
    localStorage.setItem('refreshToken', 'mocked-refresh-token');
    mockAxios.onGet(`${API_URL}/tasks`).reply(200, { status: 'OK', data: mockTasks });

    const newTask: TaskType = {
      id: 3,
      title: 'Task 3',
      description: 'Desc 3',
      status: 'closed',
    };
    mockAxios.onPost(`${API_URL}/tasks`).reply(200, { status: 'OK', data: newTask });

    render(<App />);

    await waitFor(() => screen.getByText('Task 1'));
    fireEvent.click(screen.getByText('+ Add Task'));

    fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'Task 3' } });
    fireEvent.change(screen.getByPlaceholderText('Description'), { target: { value: 'Desc 3' } });
    const comboboxes = screen.getAllByRole('combobox');
    const modalCombobox = comboboxes.find((combobox) =>
      combobox.closest('.modal-content')
    );
    if (!modalCombobox) throw new Error('Modal combobox not found');

    fireEvent.click(screen.getByText('Add Task'));

    await waitFor(() => {
      expect(screen.getByText('Task 3')).toBeInTheDocument();
    });
  });
  it('updates an existing task', async () => {
    localStorage.setItem('accessToken', `Bearer ${mockJwtToken}`);
    localStorage.setItem('refreshToken', 'mocked-refresh-token');
    mockAxios.onGet(`${API_URL}/tasks`).reply(200, { status: 'OK', data: mockTasks });

    const updatedTask: TaskType = {
      id: 1,
      title: 'Updated Task 1',
      description: 'Updated Desc 1',
      status: 'in-progress',
    };
    mockAxios.onPut(`${API_URL}/tasks/1`).reply(200, { status: 'OK', data: updatedTask });

    render(<App />);

    await waitFor(() => screen.getByText('Task 1'));
    fireEvent.click(screen.getAllByText('Edit')[0]);

    fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'Updated Task 1' } });
    fireEvent.change(screen.getByPlaceholderText('Description'), { target: { value: 'Updated Desc 1' } });

    const modal = screen.getByText('Edit Task').closest('.modal-content') as HTMLElement;
    const modalCombobox = within(modal).getByRole('combobox');
    fireEvent.change(modalCombobox, { target: { value: 'in-progress' } });

    fireEvent.click(screen.getByText('Update Task'));

    await waitFor(
      () => {
        expect(screen.getByText('Updated Task 1')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });
  it('deletes an existing task', async () => {
    localStorage.setItem('accessToken', `Bearer ${mockJwtToken}`);
    localStorage.setItem('refreshToken', 'mocked-refresh-token');
    mockAxios.onGet(`${API_URL}/tasks`).reply(200, { status: 'OK', data: mockTasks });
    mockAxios.onDelete(`${API_URL}/tasks/1`).reply(200, { status: 'OK' });

    render(<App />);

    await waitFor(() => screen.getByText('Task 1'));
    fireEvent.click(screen.getAllByText('Delete')[0]);

    fireEvent.click(screen.getByText('Yes, Delete'));

    await waitFor(() => {
      expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });
  });
  it('logs out and clears tasks', async () => {
    localStorage.setItem('accessToken', `Bearer ${mockJwtToken}`);
    localStorage.setItem('refreshToken', 'mocked-refresh-token');
    mockAxios.onGet(`${API_URL}/tasks`).reply(200, { status: 'OK', data: mockTasks });
    mockAxios.onPost(`${API_URL}/auth/sign-out`).reply(200, { status: 'OK' });



    render(<App />);

    await waitFor(() => screen.getByText('Task 1'));
    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Logged out successfully!');
    });

    await waitFor(() => {
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
    });
  });
});