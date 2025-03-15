import React from "react";
import {TaskType} from "../../types/task.type.ts";


type EditFormProps = {
  editTask: (e: React.FormEvent) => void;
  setTask: <K extends keyof TaskType>({field, fieldValue}: { field: K; fieldValue: TaskType[K] }) => void;
  closeModal: () => void;
  task: TaskType;
  statuses: { value: string; label: string }[];
}

const EditForm = ({editTask, setTask, closeModal, task, statuses}: EditFormProps) => {
  const onTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTask({field: "title", fieldValue: e.target.value});
  }
  const onDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTask({field: "description", fieldValue: e.target.value});
  }

  const onStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTask({field: "status", fieldValue: e.target.value});
  }
  return (
    <>
      <form onSubmit={editTask} className="modal-form">
        <div className="form-group">
          <input
            type="text"
            placeholder="Title"
            value={task.title}
            onChange={onTitleChange}
          />
        </div>
        <textarea
          placeholder="Description"
          value={task.description}
          onChange={onDescriptionChange}
        />
        <select value={task.status} onChange={onStatusChange}>
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <div className="modal-actions">
          <button type="submit">Update Task</button>
          <button type="button" onClick={closeModal}>
            Cancel
          </button>
        </div>
      </form>
    </>
  )
}

export default EditForm;