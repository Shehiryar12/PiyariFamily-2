import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Images } from '../../../Assets';
import HiddenPhotoOverlay from '../../../Components/HiddenPhotoOverlay';
import { getImageCacheKey, type SuggestedMatch } from '../../../API';
import { confirmPhotoAccessRequest } from '../../../Functions/photoAccessRequest';
import { Colors } from '../../../Constant/Colors';
import { Fonts } from '../../../Constant/Fonts';
import { Strings } from '../../../Constant/Strings';
import { fs, hp, wp } from '../../../Functions/responsive';

type Props = {
  match: SuggestedMatch;
  onPress: () => void;
  onLike: () => void;
  liking?: boolean;
};

const SearchMatchCard = ({ match, onPress, onLike, liking }: Props) => (
  <TouchableOpacity
    style={styles.card}
    activeOpacity={0.9}
    onPress={onPress}
  >
    <View style={styles.imageWrap}>
      <Image
        key={getImageCacheKey(match.image, match.id)}
        source={match.image}
        style={styles.image}
        resizeMode="cover"
      />
      {match.pictureHidden ? (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={0.9}
          onPress={() => confirmPhotoAccessRequest(match.id)}
        >
          <HiddenPhotoOverlay />
        </TouchableOpacity>
      ) : null}

      <View style={styles.badgeColumn}>
        <View style={styles.tierBadge}>
          <Icon
            name={match.tier === 'VIP' ? 'star' : 'crown'}
            size={fs(10)}
            color={Colors.white}
          />
          <Text style={styles.tierText}>{match.tier}</Text>
        </View>
      </View>

      {match.isVerified ? (
        <View style={styles.verifiedRow}>
          <Image
            source={Images.verifiedIcon}
            style={styles.verifiedIcon}
            resizeMode="contain"
          />
          <Text style={styles.verifiedText}>{Strings.verifiedBadge}</Text>
        </View>
      ) : null}
    </View>

    <View style={styles.body}>
      <Text style={styles.name}>
        {match.name}, {match.age}
      </Text>
      <View style={styles.locationRow}>
        <Icon name="map-marker-outline" size={fs(11)} color={Colors.textLight} />
        <Text style={styles.location}>{match.location}</Text>
      </View>
      <View style={styles.bottomRow}>
        <View style={styles.professionTag}>
          <Text style={styles.professionText}>{match.profession}</Text>
        </View>
        <TouchableOpacity
          style={styles.likeBtn}
          activeOpacity={0.85}
          disabled={liking}
          onPress={onLike}
        >
          <Icon
            name={match.isLiked ? 'heart' : 'heart-outline'}
            size={fs(16)}
            color={match.isLiked ? Colors.redish : Colors.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    width: '48%',
    marginBottom: wp('3%'),
    backgroundColor: Colors.white,
    borderRadius: wp('4.5%'),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  imageWrap: {
    width: '100%',
    height: hp('15.5%'),
    position: 'relative',
    backgroundColor: Colors.gradientStart,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('0.8%'),
    backgroundColor: Colors.gold,
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.3%'),
    borderRadius: wp('2.5%'),
  },
  tierText: {
    fontSize: fs(9),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  body: {
    paddingHorizontal: wp('3%'),
    paddingTop: hp('1%'),
    paddingBottom: hp('1.1%'),
  },
  name: {
    fontSize: fs(14),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('0.2%'),
  },
  badgeColumn: {
    position: 'absolute',
    top: hp('0.8%'),
    right: wp('2%'),
    alignItems: 'flex-end',
    gap: hp('0.35%'),
  },
  verifiedRow: {
    position: 'absolute',
    left: wp('2%'),
    bottom: hp('0.8%'),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
    backgroundColor: Colors.white,
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.35%'),
    borderRadius: wp('5.5%'),
  },
  verifiedIcon: {
    width: fs(11),
    height: fs(11),
    tintColor: Colors.gold,
  },
  verifiedText: {
    fontSize: fs(9),
    fontFamily: Fonts.medium,
    color: Colors.black,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('0.5%'),
    marginBottom: hp('0.9%'),
  },
  location: {
    fontSize: fs(11),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  professionTag: {
    backgroundColor: Colors.suggestedTagBg,
    paddingHorizontal: wp('2.8%'),
    paddingVertical: hp('0.4%'),
    borderRadius: wp('3%'),
    maxWidth: '68%',
  },
  professionText: {
    fontSize: fs(10),
    fontFamily: Fonts.medium,
    color: Colors.primary,
  },
  likeBtn: {
    width: wp('8.5%'),
    height: wp('8.5%'),
    borderRadius: wp('4.25%'),
    borderWidth: 1,
    borderColor: Colors.focusBorder,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SearchMatchCard;
