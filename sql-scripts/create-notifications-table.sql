DROP TABLE IF EXISTS notifications;

CREATE TABLE notifications (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    subject_id INTEGER REFERENCES users(id),
    type TEXT NOT NULL,
    seen BOOLEAN NOT NULL DEFAULT false,
    time_created TIMESTAMP DEFAULT now() NOT NULL
)