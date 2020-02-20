DROP TABLE IF EXISTS partner_pairs;

CREATE TABLE partner_pairs (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user1_id INTEGER REFERENCES users(id) NOT NULL,
    user2_id INTEGER REFERENCES users(id) NOT NULL
)