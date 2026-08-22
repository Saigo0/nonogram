CREATE TABLE puzzles (
    id BIGSERIAL PRIMARY KEY,
    size INTEGER NOT NULL,
    row_clues JSONB NOT NULL,
    col_clues JSONB NOT NULL
);

CREATE TABLE results (
    id BIGSERIAL PRIMARY KEY,

    puzzle_id BIGINT NOT NULL,

    player VARCHAR(100) NOT NULL,

    duration_seconds INTEGER NOT NULL,

    wrong_actions INTEGER NOT NULL,

    actions_per_minute NUMERIC(10, 3) NOT NULL,

    CONSTRAINT fk_results_puzzle
        FOREIGN KEY (puzzle_id)
        REFERENCES puzzles(id)
);