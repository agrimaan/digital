import { USER_ACTIONS } from '../actions/userActions';

const initialState = {
  users: [],
  total: 0,
  page: 1,
  limit: 10,
  loading: false,
  error: null,
  creating: false,
  updating: false,
  deleting: false,
};

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case USER_ACTIONS.FETCH_USERS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    
    case USER_ACTIONS.FETCH_USERS_SUCCESS:
      return {
        ...state,
        loading: false,
        users: action.payload.users,
        total: action.payload.total,
        page: action.payload.page,
        limit: action.payload.limit,
        error: null,
      };
    
    case USER_ACTIONS.FETCH_USERS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    
    case USER_ACTIONS.CREATE_USER_REQUEST:
      return {
        ...state,
        creating: true,
        error: null,
      };
    
    case USER_ACTIONS.CREATE_USER_SUCCESS:
      return {
        ...state,
        creating: false,
        users: [action.payload, ...state.users],
        total: state.total + 1,
        error: null,
      };
    
    case USER_ACTIONS.CREATE_USER_FAILURE:
      return {
        ...state,
        creating: false,
        error: action.payload,
      };
    
    case USER_ACTIONS.UPDATE_USER_REQUEST:
      return {
        ...state,
        updating: true,
        error: null,
      };
    
    case USER_ACTIONS.UPDATE_USER_SUCCESS:
      return {
        ...state,
        updating: false,
        users: state.users.map(user =>
          user._id === action.payload._id ? action.payload : user
        ),
        error: null,
      };
    
    case USER_ACTIONS.UPDATE_USER_FAILURE:
      return {
        ...state,
        updating: false,
        error: action.payload,
      };
    
    case USER_ACTIONS.DELETE_USER_REQUEST:
      return {
        ...state,
        deleting: true,
        error: null,
      };
    
    case USER_ACTIONS.DELETE_USER_SUCCESS:
      return {
        ...state,
        deleting: false,
        users: state.users.filter(user => user._id !== action.payload),
        total: state.total - 1,
        error: null,
      };
    
    case USER_ACTIONS.DELETE_USER_FAILURE:
      return {
        ...state,
        deleting: false,
        error: action.payload,
      };
    
    case USER_ACTIONS.BULK_DELETE_USERS_REQUEST:
      return {
        ...state,
        deleting: true,
        error: null,
      };
    
    case USER_ACTIONS.BULK_DELETE_USERS_SUCCESS:
      return {
        ...state,
        deleting: false,
        users: state.users.filter(user => !action.payload.includes(user._id)),
        total: state.total - action.payload.length,
        error: null,
      };
    
    case USER_ACTIONS.BULK_DELETE_USERS_FAILURE:
      return {
        ...state,
        deleting: false,
        error: action.payload,
      };
    
    case USER_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    default:
      return state;
  }
};

export default userReducer;