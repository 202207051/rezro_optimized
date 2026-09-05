CREATE TABLE
    IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        username VARCHAR(32) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(20) NOT NULL,
        gold INT UNSIGNED NOT NULL DEFAULT 0,
        rating_score INT NOT NULL DEFAULT 1000,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    IF NOT EXISTS user_items (
        user_id VARCHAR(64) NOT NULL,
        item_key VARCHAR(20) NOT NULL,
        quantity INT UNSIGNED NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id, item_key),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    IF NOT EXISTS user_titles (
        user_id VARCHAR(64) PRIMARY KEY,
        owned_title_ids JSON NOT NULL,
        equipped_title_id VARCHAR(32) NULL,
        stats_total_wins INT NOT NULL DEFAULT 0,
        stats_consecutive_wins INT NOT NULL DEFAULT 0,
        stats_total_games INT NOT NULL DEFAULT 0,
        stats_perfect_game BOOLEAN NOT NULL DEFAULT FALSE,
        stats_avg_speed FLOAT NOT NULL DEFAULT 0,
        stats_lang_wins JSON NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    IF NOT EXISTS match_code_history (
        history_id VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        room_id VARCHAR(32) NOT NULL,
        submitted_at TIMESTAMP NOT NULL,
        lang VARCHAR(16) NOT NULL,
        mode VARCHAR(16),
        code TEXT NOT NULL,
        codes JSON NOT NULL,
        problems JSON NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    IF NOT EXISTS rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'WAITING',
        mode VARCHAR(8) NOT NULL,
        game_mode VARCHAR(16) NOT NULL,
        difficulty VARCHAR(16) NOT NULL,
        language VARCHAR(16) NOT NULL,
        password VARCHAR(64) NOT NULL DEFAULT '',
        problem_count TINYINT NOT NULL,
        max_players TINYINT NOT NULL,
        host_user_id VARCHAR(64) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (host_user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    IF NOT EXISTS room_participants (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        room_id INT NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        slot_index TINYINT NOT NULL,
        is_host BOOLEAN NOT NULL DEFAULT FALSE,
        is_ready BOOLEAN NOT NULL DEFAULT FALSE,
        language VARCHAR(16),
        `character` VARCHAR(16),
        status VARCHAR(16) NOT NULL DEFAULT 'WAITING',
        selected_items JSON NULL,
        joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        left_at TIMESTAMP NULL,
        FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    IF NOT EXISTS problems (
        id VARCHAR(16) PRIMARY KEY,
        type VARCHAR(32) NOT NULL,
        difficulty VARCHAR(16) NOT NULL,
        title VARCHAR(200) NOT NULL,
        question TEXT NOT NULL,
        answer JSON NOT NULL,
        options JSON NULL,
        correct_index TINYINT NULL,
        explanation TEXT NOT NULL,
        description TEXT NULL,
        input TEXT NULL,
        output TEXT NULL,
        visual JSON NULL,
        capability_overrides JSON NULL
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    IF NOT EXISTS matches (
        id VARCHAR(64) PRIMARY KEY,
        room_id INT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'IN_PROGRESS',
        lang VARCHAR(16) NOT NULL,
        difficulty VARCHAR(16) NOT NULL,
        problem_count TINYINT NOT NULL,
        max_players TINYINT NOT NULL,
        room_mode VARCHAR(8) NOT NULL,
        game_mode VARCHAR(16) NOT NULL,
        round_seconds INT NOT NULL,
        started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        finished_at TIMESTAMP NULL,
        FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE SET NULL
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    IF NOT EXISTS match_problems (
        match_id VARCHAR(64) NOT NULL,
        problem_index TINYINT NOT NULL,
        problem_id VARCHAR(16) NOT NULL,
        problem_snapshot JSON NOT NULL,
        PRIMARY KEY (match_id, problem_index),
        FOREIGN KEY (match_id) REFERENCES matches (id) ON DELETE CASCADE,
        FOREIGN KEY (problem_id) REFERENCES problems (id) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    IF NOT EXISTS match_submissions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        match_id VARCHAR(64) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        ingame_score INT NOT NULL DEFAULT 0,
        rating_score_before INT NOT NULL,
        rating_delta INT NOT NULL,
        codes JSON NOT NULL,
        blank_answers JSON NULL,
        selected_options JSON NULL,
        solve_times JSON NOT NULL,
        problem_results JSON NOT NULL,
        solved_problems JSON NOT NULL,
        total_solve_time FLOAT NOT NULL,
        completion_time FLOAT NOT NULL,
        finished_at_elapsed FLOAT NULL,
        submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (match_id) REFERENCES matches (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    IF NOT EXISTS match_rankings (
        match_id VARCHAR(64) PRIMARY KEY,
        finalized_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        elapsed_sec INT NOT NULL,
        round_seconds INT NOT NULL,
        total_problems INT NOT NULL,
        rankings_json JSON NOT NULL,
        FOREIGN KEY (match_id) REFERENCES matches (id) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    IF NOT EXISTS friends (
        user_id VARCHAR(64) NOT NULL,
        friend_user_id VARCHAR(64) NOT NULL,
        added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, friend_user_id),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (friend_user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE
    IF NOT EXISTS review_invites (
        id VARCHAR(64) PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL,
        from_user_id VARCHAR(64) NOT NULL,
        to_user_id VARCHAR(64) NOT NULL,
        problem_indices JSON NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (to_user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;