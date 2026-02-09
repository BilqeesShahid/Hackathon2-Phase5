"""
Integration tests for recurring tasks functionality.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime, timedelta

from app.services.task_service import TaskService
from app.models.task import Task


@pytest.fixture
def mock_db_session():
    """Mock database session for testing."""
    session = MagicMock()
    session.add = MagicMock()
    session.commit = MagicMock()
    session.refresh = MagicMock()
    session.exec = MagicMock()
    return session


@pytest.mark.asyncio
async def test_recurring_task_creation(mock_db_session):
    """Test creating a recurring task."""
    # Arrange
    task_service = TaskService(mock_db_session)

    # Mock the query result for finding the task
    mock_task = MagicMock(spec=Task)
    mock_task.id = 1
    mock_task.user_id = "user123"
    mock_task.title = "Weekly Meeting"
    mock_task.description = "Team weekly sync"
    mock_task.completed = False
    mock_task.priority = "high"
    mock_task.due_date = datetime.now() + timedelta(days=7)
    mock_task.tags = ["work", "meeting"]
    mock_task.recurrence = "weekly"
    mock_task.recurrence_rule = None
    mock_task.created_at = datetime.utcnow()
    mock_task.updated_at = datetime.utcnow()

    # Mock the session.exec().first() to return our mock task
    mock_query_result = MagicMock()
    mock_query_result.first.return_value = mock_task
    mock_db_session.exec.return_value = mock_query_result

    # Act
    task = task_service.create_task(
        user_id="user123",
        title="Weekly Meeting",
        description="Team weekly sync",
        priority="high",
        recurrence="weekly",
        tags=["work", "meeting"]
    )

    # Assert
    assert task.title == "Weekly Meeting"
    assert task.recurrence == "weekly"
    assert "work" in task.tags
    mock_db_session.add.assert_called_once()
    mock_db_session.commit.assert_called_once()


@pytest.mark.asyncio
async def test_recurring_task_completion_creates_next_occurrence(mock_db_session):
    """Test that completing a recurring task creates the next occurrence."""
    # Arrange
    task_service = TaskService(mock_db_session)

    # Create a mock completed task with recurrence
    completed_task = MagicMock(spec=Task)
    completed_task.id = 1
    completed_task.user_id = "user123"
    completed_task.title = "Weekly Meeting"
    completed_task.description = "Team weekly sync"
    completed_task.completed = False  # Will be set to True
    completed_task.priority = "high"
    completed_task.due_date = datetime.now()
    completed_task.tags = ["work", "meeting"]
    completed_task.recurrence = "weekly"
    completed_task.recurrence_rule = None
    completed_task.created_at = datetime.utcnow()
    completed_task.updated_at = datetime.utcnow()

    # Mock the session.exec().first() to return the completed task
    mock_query_result = MagicMock()
    mock_query_result.first.return_value = completed_task
    mock_db_session.exec.return_value = mock_query_result

    # Mock the new task that will be created
    new_task = MagicMock(spec=Task)
    new_task.id = 2
    new_task.user_id = "user123"
    new_task.title = "Weekly Meeting"
    new_task.recurrence = "weekly"

    # Update the mock to return the new task when add is called
    def add_side_effect(obj):
        obj.id = 2  # Assign ID to simulate database insertion
    mock_db_session.add.side_effect = add_side_effect

    # Act
    result_task = task_service.complete_task(task_id=1, user_id="user123")

    # Assert
    assert result_task.completed is True
    # Verify that a new task was created as a result of the recurrence
    assert mock_db_session.add.call_count >= 2  # Original task + new recurring task
    mock_db_session.commit.assert_called()


def test_calculate_next_occurrence_weekly():
    """Test calculating next occurrence for weekly recurrence."""
    # Arrange
    task_service = TaskService(MagicMock())

    # Act
    last_completion = datetime(2026, 2, 4)  # Wednesday
    next_occurrence = task_service.calculate_next_occurrence("weekly", None, last_completion)

    # Assert
    expected = last_completion + timedelta(weeks=1)
    assert next_occurrence.date() == expected.date()


def test_calculate_next_occurrence_daily():
    """Test calculating next occurrence for daily recurrence."""
    # Arrange
    task_service = TaskService(MagicMock())

    # Act
    last_completion = datetime(2026, 2, 4)
    next_occurrence = task_service.calculate_next_occurrence("daily", None, last_completion)

    # Assert
    expected = last_completion + timedelta(days=1)
    assert next_occurrence.date() == expected.date()


def test_calculate_next_occurrence_monthly():
    """Test calculating next occurrence for monthly recurrence."""
    # Arrange
    task_service = TaskService(MagicMock())

    # Act
    last_completion = datetime(2026, 2, 4)  # February 4
    next_occurrence = task_service.calculate_next_occurrence("monthly", None, last_completion)

    # Assert
    # Should be March 4, 2026
    assert next_occurrence.year == 2026
    assert next_occurrence.month == 3
    assert next_occurrence.day == 4


def test_calculate_next_occurrence_invalid():
    """Test calculating next occurrence for invalid recurrence."""
    # Arrange
    task_service = TaskService(MagicMock())

    # Act
    last_completion = datetime(2026, 2, 4)
    next_occurrence = task_service.calculate_next_occurrence("invalid", None, last_completion)

    # Assert
    assert next_occurrence is None