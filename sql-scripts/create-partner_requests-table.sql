DROP TABLE IF EXISTS partner_requests;

CREATE TABLE partner_requests (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    requester_id INTEGER REFERENCES users(id) NOT NULL,
    requested_id INTEGER REFERENCES users(id) NOT NULL
)