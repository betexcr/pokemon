/** Shape of entries in test-users.json used by the Playwright specs. */
export interface TestUser {
  email: string;
  password: string;
  displayName?: string;
  uid?: string;
  teamId?: string;
}
