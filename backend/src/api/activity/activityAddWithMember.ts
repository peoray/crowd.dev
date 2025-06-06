import Permissions from '../../security/permissions'
import ActivityService from '../../services/activityService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * POST /activity/with-member
 * @summary Create or update an activity with a member
 * @tag Activities
 * @security Bearer
 * @description Create or update an activity with a member
 * Activity existence is checked by sourceId
 * Member existence is checked by platform and username
 * @bodyContent {ActivityUpsertWithMemberInput} application/json
 * @response 200 - Ok
 * @responseContent {Activity} 200.application/json
 * @responseExample {ActivityUpsert} 200.application/json.Activity
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.activityCreate)
  const payload = await new ActivityService(req).createWithMember(req.body)

  await req.responseHandler.success(req, res, payload)
}
