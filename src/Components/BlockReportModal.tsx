import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { REPORT_REASONS } from '../Constant/ChatModals';
import { AuthStyles, FontSizes } from '../Constant/AuthStyles';
import { Colors } from '../Constant/Colors';
import { Fonts } from '../Constant/Fonts';
import { Strings } from '../Constant/Strings';
import { fs, hp, wp } from '../Functions/responsive';

type Props = {
  visible: boolean;
  contactName: string;
  onClose: () => void;
  onSubmit: (reasonId: string, details: string) => void;
};

const BlockReportModal = ({
  visible,
  contactName,
  onClose,
  onSubmit,
}: Props) => {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0].id);
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (!visible) {
      setSelectedReason(REPORT_REASONS[0].id);
      setDetails('');
    }
  }, [visible]);

  const subtitle = Strings.chooseActionFor.replace('{name}', contactName);

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      backdropOpacity={0.5}
      useNativeDriver
      hideModalContentWhileAnimating
    >
      <View style={styles.dialog}>
        <View style={styles.iconWrap}>
          <Icon name="shield-alert-outline" size={fs(28)} color={Colors.white} />
        </View>

        <Text style={styles.title}>{Strings.blockOrReport}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.optionsScroll}
          bounces={false}
        >
          {REPORT_REASONS.map(reason => {
            const selected = selectedReason === reason.id;

            return (
              <TouchableOpacity
                key={reason.id}
                style={[styles.optionCard, selected && styles.optionCardActive]}
                activeOpacity={0.85}
                onPress={() => setSelectedReason(reason.id)}
              >
                <View
                  style={[
                    styles.radioOuter,
                    selected && styles.radioOuterActive,
                  ]}
                >
                  {selected ? <View style={styles.radioInner} /> : null}
                </View>

                <View style={styles.optionTextWrap}>
                  <Text style={styles.optionTitle}>{reason.title}</Text>
                  <Text style={styles.optionDesc}>{reason.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TextInput
          style={styles.detailsInput}
          placeholder={Strings.addDetailsOptional}
          placeholderTextColor={Colors.placeholder}
          value={details}
          onChangeText={setDetails}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.noticeBar}>
          <Icon name="shield-check-outline" size={fs(15)} color={Colors.gold} />
          <Text style={styles.noticeText}>{Strings.reportConfidentialNotice}</Text>
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          activeOpacity={0.88}
          onPress={() => onSubmit(selectedReason, details.trim())}
        >
          <Icon name="shield-alert" size={fs(18)} color={Colors.white} />
          <Text style={styles.submitBtnText}>{Strings.blockAndReport}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          activeOpacity={0.85}
          onPress={onClose}
        >
          <Text style={styles.cancelBtnText}>{Strings.cancelAction}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: Colors.white,
    borderRadius: wp('5%'),
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2.5%'),
    paddingBottom: hp('2%'),
    maxHeight: hp('88%'),
  },
  iconWrap: {
    width: wp('14%'),
    height: wp('14%'),
    borderRadius: wp('7%'),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: hp('1.2%'),
  },
  title: {
    fontSize: FontSizes.h3,
    fontFamily: Fonts.bold,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: hp('0.4%'),
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: fs(13),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: hp('1.5%'),
  },
  optionsScroll: {
    maxHeight: hp('28%'),
    marginBottom: hp('1.2%'),
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('3.5%'),
    padding: wp('3.5%'),
    marginBottom: hp('0.8%'),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionCardActive: {
    borderColor: '#F0D0D8',
    backgroundColor: '#FFF5F7',
  },
  radioOuter: {
    width: wp('5%'),
    height: wp('5%'),
    borderRadius: wp('2.5%'),
    borderWidth: 2,
    borderColor: '#D0D0D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('3%'),
    marginTop: hp('0.2%'),
  },
  radioOuterActive: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: wp('2.5%'),
    height: wp('2.5%'),
    borderRadius: wp('1.25%'),
    backgroundColor: Colors.primary,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: fs(13),
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
    marginBottom: hp('0.2%'),
  },
  optionDesc: {
    fontSize: fs(11),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    lineHeight: hp('1.7%'),
  },
  detailsInput: {
    minHeight: hp('8%'),
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('3%'),
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1.2%'),
    fontSize: fs(13),
    fontFamily: Fonts.regular,
    color: Colors.label,
    marginBottom: hp('1.2%'),
  },
  noticeBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp('2%'),
    backgroundColor: '#FFF8E7',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1%'),
    marginBottom: hp('1.5%'),
  },
  noticeText: {
    flex: 1,
    fontSize: fs(10),
    fontFamily: Fonts.regular,
    color: '#8A6D1D',
    lineHeight: hp('1.6%'),
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: wp('3.5%'),
    height: AuthStyles.buttonHeight,
    gap: wp('2%'),
    marginBottom: hp('1%'),
  },
  submitBtnText: {
    fontSize: FontSizes.button,
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: wp('3.5%'),
    height: AuthStyles.buttonHeight,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelBtnText: {
    fontSize: FontSizes.button,
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
});

export default BlockReportModal;
