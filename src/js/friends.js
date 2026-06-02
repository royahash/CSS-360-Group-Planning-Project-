// ── Friend Request API Functions ──────────────────────────────────────────

/**
 * Send a friend request to a user by username
 * @param {string} username - The username of the user to add as friend
 * @returns {Promise<Object>} Response from server
 */
export async function sendFriendRequest(username) {
  try {
    const response = await fetch('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send friend request');
    }

    return await response.json();
  } catch (err) {
    console.error('Error sending friend request:', err);
    throw err;
  }
}

/**
 * Get all pending friend requests for current user
 * @returns {Promise<Array>} Array of pending friend requests
 */
export async function getPendingRequests() {
  try {
    const response = await fetch('/api/friends/requests', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch pending requests');
    }

    return await response.json();
  } catch (err) {
    console.error('Error fetching pending requests:', err);
    throw err;
  }
}

/**
 * Accept a friend request from a user
 * @param {string} senderId - The ID of the user who sent the request
 * @returns {Promise<Object>} Response from server
 */
export async function acceptFriendRequest(senderId) {
  try {
    const response = await fetch(`/api/friends/accept/${senderId}`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to accept friend request');
    }

    return await response.json();
  } catch (err) {
    console.error('Error accepting friend request:', err);
    throw err;
  }
}

/**
 * Decline a friend request from a user
 * @param {string} senderId - The ID of the user who sent the request
 * @returns {Promise<Object>} Response from server
 */
export async function declineFriendRequest(senderId) {
  try {
    const response = await fetch(`/api/friends/decline/${senderId}`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to decline friend request');
    }

    return await response.json();
  } catch (err) {
    console.error('Error declining friend request:', err);
    throw err;
  }
}

/**
 * Get list of friends for current user
 * @returns {Promise<Array>} Array of friend objects
 */
export async function getFriendsList() {
  try {
    const response = await fetch('/api/friends', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch friends list');
    }

    return await response.json();
  } catch (err) {
    console.error('Error fetching friends list:', err);
    throw err;
  }
}

/**
 * Delete a friend
 * @param {string} friendId - The ID of the friend to remove
 * @returns {Promise<Object>} Response from server
 */
export async function removeFriend(friendId) {
  try {
    const response = await fetch(`/api/friends/${friendId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove friend');
    }

    return await response.json();
  } catch (err) {
    console.error('Error removing friend:', err);
    throw err;
  }
}

/**
 * Get saved events for a specific user
 * @param {string} userId - The ID of the user
 * @returns {Promise<Array>} Array of events saved by the user
 */
export async function getFriendEvents(userId) {
  try {
    const response = await fetch(`/api/friends/${userId}/events`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch friend events');
    }

    return await response.json();
  } catch (err) {
    console.error('Error fetching friend events:', err);
    throw err;
  }
}
