/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this plugin in the file LICENSE.md.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/OSL-3.0
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade the plugin to
 * newer versions in the future. If you wish to customize the plugin for
 * your needs please document your changes and make backups before you update.
 *
 *
 * @copyright Copyright (c) 2020 GriefMoDz
 * @license   OSL-3.0 (Open Software License ("OSL") v. 3.0)
 * @link      https://github.com/GriefMoDz/better-status-indicators
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* eslint-disable object-property-newline */
const { React, getModule, getModuleByDisplayName, i18n: { Messages } } = require('powercord/webpack');
const { Icon } = require('powercord/components');

const Flux = getModule([ 'useStateFromStores' ], false);
const Tooltip = getModuleByDisplayName('Tooltip', false);

const statusStore = getModule([ 'isMobileOnline' ], false);
const statusUtils = getModule([ 'getStatusColor' ], false);
const authStore = getModule([ 'initialize', 'getFingerprint' ], false);

const clientStatusStore = require('../stores/clientStatusStore');
const clientIcons = Object.freeze({
  web: 'Public',
  desktop: 'Monitor'
});

function renderClientStatus (client, state) {
  if (this.props.user.bot && !this.props.getSetting(`${client}ShowOnBots`, true)) {
    return null;
  }

  const matchStatus = this.props.getSetting(`${client}MatchStatus`, false);
  const settingsKey = this.props.location.replace(/^(.)|-(.)/g, (match) => match.toUpperCase()).replace(/-/g, '');

  const statusColor = Flux.useStateFromStores([ statusStore ], () => {
    const userStatus = statusStore.getStatus(this.props.user.id);
    return statusUtils.getStatusColor(userStatus);
  });

  // eslint-disable-next-line multiline-ternary
  return this.props.getSetting(`${client}${settingsKey}`, client === 'web') && state ? React.createElement(Tooltip, {
    text: Messages.BSI[`ACTIVE_ON_${client.toUpperCase()}`],
    hideOnClick: false
  }, (props) => React.createElement(Icon, Object.assign({}, props, {
    name: clientIcons[client],
    className: `bsi-${client}Icon ${getModule([ 'member', 'ownerIcon' ], false).icon}`,
    color: matchStatus ? statusColor : 'currentColor'
  }))) : null;
}

module.exports = React.memo(props => {
  if (!props.user) {
    return null;
  }

  const { user } = props;
  const isWebOnline = Flux.useStateFromStores([ statusStore ], () => {
    const showOnSelf = user.id === authStore.getId() && props.getSetting('webShowOnSelf', false);
    const clientStatus = showOnSelf ? clientStatusStore.getCurrentClientStatus() : statusStore.getState().clientStatuses[user.id];

    return clientStatus && clientStatus.web && (props.getSetting('webPreserveStatus', false) ? true : !clientStatus.desktop && !clientStatus.mobile);
  });

  const isDesktopOnline = Flux.useStateFromStores([ statusStore ], () => {
    const showOnSelf = user.id === authStore.getId() && props.getSetting('desktopShowOnSelf', false);
    const clientStatus = showOnSelf ? clientStatusStore.getCurrentClientStatus() : statusStore.getState().clientStatuses[user.id];

    return clientStatus && clientStatus.desktop && (props.getSetting('desktopPreserveStatus', false) ? clientStatus.web || clientStatus.mobile : !clientStatus.web && !clientStatus.mobile);
  });

  const _renderClientStatus = (client, state) => renderClientStatus.call({ props }, client, state);

  return [ _renderClientStatus('web', isWebOnline), _renderClientStatus('desktop', isDesktopOnline) ];
});
