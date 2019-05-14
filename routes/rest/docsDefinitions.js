// *********************************
// Devices
// *********************************

/**
 * @api {OBJECT DEFINITION} Device 1. Device definition
 * @apiGroup Devices
 * @apiVersion 8.0.0
 *
 * @apiDescription The Device object.
 *
 * @apiParam {string} deviceId [Unique, immutable] Id of the device. It is used to target this specific object.
 * @apiParam {string} deviceName [Unique, mutable] Human-readable of the device.
 * @apiParam {string} [lastUserId] Id of the user that most recently logged in using this device.
 * @apiParam {string} deviceType Type of device. Allowed: USERDEVICE, GPS, CUSTOM. Default is USERDEVICE.
 */

// *********************************
// DocFiles
// *********************************

/**
 * @api {OBJECT DEFINITION} DocFile 1. DocFile definition
 * @apiGroup DocFiles
 * @apiVersion 8.0.0
 *
 * @apiDescription The DocFile object.
 *
 * @apiParam {string} docFileId [Unique, immutable] Id of the DocFile. It is used to target this specific object.
 * @apiParam {string} code [Unique, mutable] Human-readable code to find and/or unlock the document for a user.
 * @apiParam {string} title [Unique, mutable] Title of the document.
 * @apiParam {string[]} text Text content in the document.
 */

// *********************************
// Forums
// *********************************

/**
 * @api {OBJECT DEFINITION} Forum 1. Forum definition
 * @apiGroup Forums
 * @apiVersion 8.0.0
 *
 * @apiDescription The Forum object.
 *
 * @apiParam {string} forumId [Unique, immutable] Id of the forum. It is used to target this specific object.
 * @apiParam {string[]} threadIds Ids of the threads that are connected to the forum.
 * @apiParam {string[]} text Description in the forum.
 */

/**
 * @api {OBJECT DEFINITION} ForumThread 2. Forum thread definition
 * @apiGroup Forums
 * @apiVersion 8.0.0
 *
 * @apiDescription The Forum Thread object.
 *
 * @apiParam {string} threadId [Unique, immutable] Id of the forum thread. It is used to target this specific object.
 * @apiParam {string} [title] Title of the thread.
 * @apiParam {string[]} text Text content of the thread.
 * @apiParam {string[]} postIds Ids of the posts connected to the thread.
 */

/**
 * @api {OBJECT DEFINITION} ForumPost 3. ForumPost definition
 * @apiGroup ForumPosts
 * @apiVersion 8.0.0
 *
 * @apiDescription The ForumPost object.
 *
 * @apiParam {string} postId [Unique, immutable] Id of the forum post. It is used to target this specific object.
 * @apiParam {string} [parentPostId] Id of the post that is the parent to this post.
 * @apiParam {number} depth The sub-post depth level of this post. Default is 0.
 * @apiParam {string[]} text Text content in the forum post.
 */

// *********************************
// GameCodes
// *********************************

/**
 * @api {OBJECT DEFINITION} GameCode 1. GameCode definition
 * @apiGroup GameCodes
 * @apiVersion 8.0.0
 *
 * @apiDescription The GameCode object.
 *
 * @apiParam {string} gameCodeId [Unique, immutable] Id of the game code. It is used to target this specific object.
 * @apiParam {string} code [Unique, immutable] Code of the game code. It is used to target this specific object.
 * @apiParam {string} codeType Type of code. It indicates what the user will unlock if they use the code. Valid types: TRANSACTION, DOCFILE, TEXT, PROFILE. Default is TRANSACTION.
 * @apiParam {boolean} isRenewable Should a new game code be created if this one is used?
 * @apiParam {string[]} codeContent Content that will be unlocked by the user when the code is used.
 * @apiParam {boolean} used Has the game code been used?
 */

// *********************************
// Messages
// *********************************

/**
 * @api {OBJECT DEFINITION} Message 1. Message definition
 * @apiGroup Messages
 * @apiVersion 8.0.0
 *
 * @apiDescription The Message object.
 *
 * @apiParam {string} messageId [Unique, immutable] Id of the message. It is used to target this specific object.
 * @apiParam {string} text Text content in the message.
 * @apiParam {string} roomId Id of the room that the message was sent to.
 * @apiParam {string[]} [intro] Text content that will be printed before text.
 * @apiParam {string[]} [extro] Text content that will be printed after text.
 * @apiParam {Object} [image] Image attached to the message.
 * @apiParam {Coordinates} [coordinates] GPS coordinates for where the message was sent.
 */

/**
 * @api {OBJECT DEFINITION} Coordinates 2. Coordinates definition
 * @apiGroup Messages
 * @apiVersion 8.0.0
 *
 * @apiDescription The Coordinates object.
 *
 * @apiParam {Object} coordinates GPS coordinates for where the message was sent.
 * @apiParam {number} coordinates.longitude Longitude.
 * @apiParam {number} coordinates.latitude Latitude.
 * @apiParam {number} coordinates.accuracy Position accuracy in meters.
 * @apiParam {number} [coordinates.speed] Velocity in meters per second.
 * @apiParam {number} [coordinates.heading] Heading of the tracked position. Represented with 0-359, where 0 is true north.
 */

/**
 * @api {OBJECT DEFINITION} Image 3. Image definition
 * @apiGroup Messages
 * @apiVersion 8.0.0
 *
 * @apiDescription The Image object.
 *
 * @apiParam {string} imageId [Unique, immutable] Id of the message. It is used to target this specific object..
 * @apiParam {string} fileName Human-readable name of the file.
 * @apiParam {number} width With of the image in pixels.
 * @apiParam {number} height Height of the image in pixels.
 */

// *********************************
// Positions
// *********************************

/**
 * @api {OBJECT DEFINITION} Position 1. Position definition
 * @apiGroup Positions
 * @apiVersion 8.0.0
 *
 * @apiDescription The Position object.
 *
 * @apiParam {string} positionId [Unique, immutable] Id of the position. It is used to target this specific object.
 * @apiParam {string} connectedToUser [Unique, mutable] Id of the user that is connected to the position. It is usually an indication that the position is used to show the user's position on the map.
 * @apiParam {Coordinates[]} coordinatesHistory GPS coordinates.
 * @apiParam {string} positionType Type of position. Valid types: USER, WORLD. Default is WORLD.
 * @apiParam {string[]} [description] Text content of the position.
 * @apiParam {number} radius] Radius, in meters, for the position.
 * @apiParam {string} [positionName] [Unique, mutable] Human-readable position name.
 * @apiParam {boolean} [isStationary] Is the position stationary?
 */

/**
 * @api {OBJECT DEFINITION} Coordinates 2. Coordinates definition
 * @apiGroup Positions
 * @apiVersion 8.0.0
 *
 * @apiDescription The Coordinates object.
 *
 * @apiParam {Object} coordinates GPS coordinates.
 * @apiParam {number} coordinates.longitude Longitude.
 * @apiParam {number} coordinates.latitude Latitude.
 * @apiParam {number} coordinates.accuracy Position accuracy in meters.
 * @apiParam {number} [coordinates.speed] Velocity in meters per second.
 * @apiParam {number} [coordinates.heading] Heading of the tracked position. Represented with 0-359, where 0 is true north.
 */

// *********************************
// Rooms
// *********************************

/**
 * @api {OBJECT DEFINITION} Room 1. Room definition
 * @apiGroup Rooms
 * @apiVersion 8.0.0
 *
 * @apiDescription The Room object.
 *
 * @apiParam {string} roomId [Unique, immutable] Id of the room. It is used to target this specific object.
 * @apiParam {string} roomName [Unique, mutable] Human-readable name for the room.
 * @apiParam {string} [password] Password that is required to enter the room.
 * @apiParam {string[]} participantIds Ids of the users who are part of the room. This is used for whisper rooms.
 * @apiParam {boolean} nameIsLocked Is the name of the room locked from being changed?
 * @apiParam {boolean} isAnonymous Is the room anonymous? Setting a room to anonymous will most commonly hide the sender in the messages sent to the room for other users.
 * Sender data will still be stored in the system.
 * @apiParam {boolean} isWhisper Is it a whisper room? A whisper room is a private chat room between two to * participants.
 * @apiParam {boolean} isSystemRoom Is it a system room? A system room is created on first run of the system. Removing or modifying them might break features in the system.
 */

// *********************************
// SimpleMsgs
// *********************************

/**
 * @api {OBJECT DEFINITION} SimpleMsg 1. SimpleMsg definition
 * @apiGroup SimpleMsgs
 * @apiVersion 8.0.0
 *
 * @apiDescription The SimpleMsg object.
 *
 * @apiParam {string} simpleMsgId [Unique, immutable] Id of the simple message. It is used to target this specific object.
 * @apiParam {string} text Single-line text content of the message.
 */

// *********************************
// Teams
// *********************************

/**
 * @api {OBJECT DEFINITION} Team 1. Team definition
 * @apiGroup Teams
 * @apiVersion 8.0.0
 *
 * @apiDescription The Team object.
 *
 * @apiParam {string} teamId [Unique, immutable] Id of the team. It is used to target this specific object.
 * @apiParam {string} teamName [Unique, mutable] Human-readable name for the team.
 * @apiParam {string} shortName [Unique, mutable] Human-readable short name (acronym) for the team.
 * @apiParam {boolean} isVerified Is the toom verified? Unverified team are unavailable to users.
 * @apiParam {boolean} isProtected Is the team protected?
 */

/**
 * @api {OBJECT DEFINITION} Invitation 2. Invitation definition
 * @apiGroup Teams
 * @apiVersion 8.0.0
 *
 * @apiDescription The Invitation object.
 *
 * @apiParam {string} invitationId [Unique, immutable] Id of the invitation. It is used to target this specific object.
 * @apiParam {string} receiverId Id of the user that is receiving the invitation.
 * @apiParam {string} invitationType Type of invitation. Valid types: TEAM. Default is TEAM.
 * @apiParam {string} itemId Id of the object connected to the invitation. itemId would be set to the team's Id when inviting a user to a team.
 */

/**
 * @api {OBJECT DEFINITION} Invitation 2. Invitation definition
 * @apiGroup Teams
 * @apiVersion 8.0.0
 *
 * @apiDescription The Invitation object.
 *
 * @apiParam {string} invitationId [Unique, immutable] Id of the invitation. It is used to target this specific object.
 * @apiParam {string} receiverId Id of the user that is receiving the invitation.
 * @apiParam {string} invitationType Type of invitation. Valid types: TEAM. Default is TEAM.
 * @apiParam {string} itemId Id of the object connected to the invitation. itemId would be set to the team's Id when inviting a user to a team.
 */

// *********************************
// Transactions
// *********************************

/**
 * @api {OBJECT DEFINITION} Transaction 1. Transaction definition
 * @apiGroup Transactions
 * @apiVersion 8.0.0
 *
 * @apiDescription The Transaction object.
 *
 * @apiParam {string} transactionId [Unique, immutable] Id of the transaction. It is used to target this specific object.
 * @apiParam {number} amount Amount that is transferred between wallets.
 * @apiParam {string} toWalletId Id of the wallet that is sending currency.
 * @apiParam {string} fromWalletId Id of the wallet that is receiving the currency.
 * @apiParam {string} [note] Text content that is attached to the transaction.
 * @apiParam {Coordinates} [coordinates] GPS coordinates for where the transaction was made.
 */

/**
 * @api {OBJECT DEFINITION} Wallet 2. Wallet definition
 * @apiGroup Transactions
 * @apiVersion 8.0.0
 *
 * @apiDescription The Wallet object.
 *
 * @apiParam {string} walletId [Unique, immutable] Id of the wallet. It is used to target this specific object.
 * @apiParam {number} amount Amount of currency in the wallet.
 * @apiParam {boolean} isProtected Is the wallet protected?
 */

/**
 * @api {OBJECT DEFINITION} Coordinates 3. Coordinates definition
 * @apiGroup Transactions
 * @apiVersion 8.0.0
 *
 * @apiDescription The Coordinates object.
 *
 * @apiParam {Object} coordinates GPS coordinates for where the message was sent.
 * @apiParam {number} coordinates.longitude Longitude.
 * @apiParam {number} coordinates.latitude Latitude.
 * @apiParam {number} coordinates.accuracy Position accuracy in meters.
 * @apiParam {number} [coordinates.speed] Velocity in meters per second.
 * @apiParam {number} [coordinates.heading] Heading of the tracked position. Represented with 0-359, where 0 is true north.
 */

// *********************************
// Users
// *********************************

/**
 * @api {OBJECT DEFINITION} User 2. User definition
 * @apiGroup Users
 * @apiVersion 8.0.0
 *
 * @apiDescription The User object.
 *
 * @apiParam {string} userId [Unique, immutable] Id of the user. It is used to target this specific object.
 * @apiParam {string} username [Unique, mutable] Human-readable username.
 * @apiParam {string} [fullName] Full name of the user.
 * @apiParam {string} password User's password.
 * @apiParam {string} socketId Socket.io Id.
 * @apiParam {Date} lastOnline Latest date when the user was online.
 * @apiParam {string} registerDevice Id of the device that the user used to register. Users registered through the REST API will have this field set to "RESTAPI"
 * @apiParam {boolean} hasFullAccess Should the user bypass normal access checks and get access to all objects in the system?
 * @apiParam {boolean} isVerified Is the user verified? Unverified users cannot login.
 * @apiParam {boolean} isBanned Is the user banned?
 * @apiParam {boolean} isOnline Is the user online?
 * @apiParam {boolean} isLootable Is the user lootable? This will be used on the frontend to let other players interact with the user's device and "steal" a code.
 * @apiParam {string} defaultRoomId Id of the room that is the default selected one in the frontend. Default is public.
 * @apiParam {string[]} partOfTeams Ids of the teams that the user is part off.
 * @apiParam {string[]} followingRooms Ids of the rooms that the user is following.
 */

// *********************************
// Wallets
// *********************************

/**
 * @api {OBJECT DEFINITION} Wallet 1. Wallet definition
 * @apiGroup Wallets
 * @apiVersion 8.0.0
 *
 * @apiDescription The Wallet object.
 *
 * @apiParam {string} walletId [Unique, immutable] Id of the wallet. It is used to target this specific object.
 * @apiParam {number} amount Amount of currency in the wallet.
 * @apiParam {boolean} isProtected Is the wallet protected?
 */

/**
 * @api {OBJECT DEFINITION} Transaction 2. Transaction definition
 * @apiGroup Wallets
 * @apiVersion 8.0.0
 *
 * @apiDescription The Transaction object.
 *
 * @apiParam {string} transactionId [Unique, immutable] Id of the transaction. It is used to target this specific object.
 * @apiParam {number} amount Amount that is transferred between wallets.
 * @apiParam {string} toWalletId Id of the wallet that is sending currency.
 * @apiParam {string} fromWalletId Id of the wallet that is receiving the currency.
 * @apiParam {string} [note] Text content that is attached to the transaction.
 * @apiParam {Coordinates} [coordinates] GPS coordinates for where the transaction was made.
 */
